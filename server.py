#!/usr/bin/env python3
"""
Mission Control Live Backend
Serves mission-control-live.html with Close CRM + Slack data.

Architecture (stale-while-revalidate):
  - Serves the existing mission-control-data/latest.json immediately (fast)
  - When data is stale (>10 min), triggers the refresh pipeline in the background
  - Fallback: fetches live data directly from Close + Slack if no latest.json exists

Usage:
    pip install flask flask-cors requests tzdata
    python server.py

Then open: http://localhost:7373
Force refresh: http://localhost:7373/api/refresh
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import threading
import time
from datetime import UTC, datetime, timedelta
from pathlib import Path

import requests as _requests
from flask import Flask, Response, jsonify, request, send_file
from flask_cors import CORS

# ─── CONFIG ──────────────────────────────────────────────
CLOSE_API_KEY = os.environ.get(
    "CLOSE_API_KEY",
    "api_6z7YoC1gqAl8Hgp42DWNNc.2eqi7Ji3YsJgKKUIDzaFPw",
)
ANDRE_USER_ID  = "user_bnfoZDGbTqBZ4wcDGqRqTwjRKiwLnQ4mpV3i2enPkMt"
ANDRE_OWNER_NAME = "Andre"
LEAD_OWNER_FIELD = "00. \U0001fa96 LEAD OWNER"   # 🪖
ANDRE_OWNER_VALUE = "01. \U0001f60e Andre"         # 😎

ROOT = Path(__file__).parent
HTML_PATH     = ROOT / "mission-control-live.html"
ORACLE_PATH   = ROOT / "oracle-enrichment-dossier.html"
ANDRE_INTEL_PATH = ROOT / "mission-control-andre1.html"
LATEST_JSON   = ROOT / "mission-control-data" / "latest.json"
SLACK_CACHE   = ROOT / ".cache" / "slack-watch" / "latest.json"
REFRESH_SCRIPT = ROOT / "refresh-mission-control.mjs"
STALE_AFTER   = 600   # seconds — 10 min. If latest.json is older, trigger refresh
PORT          = int(os.environ.get("MC_PORT", "8787"))
AGENT_STATE_FILES = {
    "inbox-reader": ROOT / ".cache" / "agent-control" / "inbox-reader" / "latest.json",
    "cadence-sender": ROOT / ".cache" / "agent-control" / "cadence-sender" / "latest.json",
    "tasting-closer": ROOT / ".cache" / "agent-control" / "tasting-closer" / "latest.json",
}
AGENT_SCRIPTS = {
    "inbox-reader": ROOT / "inbox-reader-agent.mjs",
    "cadence-sender": ROOT / "cadence-sender-agent.mjs",
    "tasting-closer": ROOT / "tasting-closer-agent.mjs",
}

# ─── APP ─────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

_refresh_lock = threading.Lock()
_refreshing   = False


# ─── CLOSE CRM MINI CLIENT ───────────────────────────────

class CloseClient:
    BASE = "https://api.close.com/api/v1"

    def __init__(self, timeout: int = 25) -> None:
        self.auth    = (CLOSE_API_KEY, "")
        self.timeout = timeout

    def get(self, path: str, **params) -> dict:
        url = f"{self.BASE}/{path.lstrip('/')}"
        r = _requests.get(url, auth=self.auth, params=params, timeout=self.timeout)
        r.raise_for_status()
        return r.json()

    def list_page(self, path: str, limit: int = 200, skip: int = 0, **params) -> dict:
        return self.get(path, _limit=limit, _skip=skip, **params)

    def get_recent_leads(self) -> list[dict]:
        """Fetch the 300 most recently updated leads — 2 API calls."""
        page1 = self.list_page("lead/", limit=200, skip=0,   _order_by="date_updated")
        page2 = self.list_page("lead/", limit=100, skip=200, _order_by="date_updated")
        seen: set = set()
        combined = []
        for lead in page1.get("data", []) + page2.get("data", []):
            lid = lead.get("id")
            if lid and lid not in seen:
                seen.add(lid)
                combined.append(lead)
        return combined

    def get_recent_activities(self, lead_id: str, limit: int = 8) -> list[dict]:
        """Fetch the last N activities for a lead — single API call."""
        return self.get("activity/", lead_id=lead_id, _limit=limit,
                        _order_by="-date_created").get("data", [])

    def get_tasks(self) -> list[dict]:
        """Fetch open tasks assigned to André."""
        return self.get("task/", assigned_to=ANDRE_USER_ID, is_complete="false",
                        _limit=100).get("data", [])


# ─── DATA HELPERS ────────────────────────────────────────

def is_andres(lead: dict) -> bool:
    custom = lead.get("custom") or {}
    if custom.get(LEAD_OWNER_FIELD) == ANDRE_OWNER_VALUE:
        return True
    for key, val in custom.items():
        if "LEAD OWNER" in str(key).upper() and "Andre" in str(val):
            return True
    return False


def to_close_url(lead_id: str) -> str:
    return f"https://app.close.com/lead/{lead_id}/"


def parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        cleaned = value.strip().replace("Z", "+00:00")
        parsed = datetime.fromisoformat(cleaned)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=UTC)
        return parsed.astimezone(UTC)
    except (ValueError, AttributeError):
        return None


def days_since(iso_str: str | None) -> int | None:
    dt = parse_dt(iso_str)
    if not dt:
        return None
    return max((datetime.now(UTC) - dt).days, 0)


def classify_lead(lead: dict, activities: list[dict]) -> dict:
    """Score a lead and classify into lanes."""
    lead_id   = lead.get("id", "")
    lead_name = lead.get("display_name") or lead.get("name") or "Unknown"
    stage     = lead.get("status_label") or "Unknown"
    updated   = lead.get("date_updated")
    created   = lead.get("date_created")

    # Direction of last activity
    last_dir = None
    last_ts  = None
    for act in activities:  # already sorted newest-first
        direction = "inbound" if (act.get("direction") == "incoming" or act.get("incoming")) else "outbound"
        ts        = parse_dt(act.get("date_created") or act.get("date_sent") or act.get("date"))
        if last_dir is None:
            last_dir = direction
            last_ts  = ts
            break

    d_updated = days_since(updated)
    d_created = days_since(created)

    replies_owed = last_dir == "inbound"
    follow_up    = not replies_owed and (d_updated is not None and d_updated >= 2)
    fresh        = d_updated is not None and d_updated <= 3
    new_lead     = d_created is not None and d_created <= 7

    # Score
    score = 0
    if replies_owed:
        score += 45
    if "proposal" in stage.lower() or "quote" in stage.lower():
        score += 25
    elif "won" in stage.lower() or "closed" in stage.lower():
        score -= 50
    elif "lost" in stage.lower() or "dead" in stage.lower():
        score -= 20
    if fresh:
        score += (15 if d_updated == 0 else 8)
    if follow_up:
        score += 15
    if new_lead:
        score += 10

    if score >= 55:
        bucket = "Hot"
    elif score >= 25:
        bucket = "Warm"
    else:
        bucket = "Cold"

    # Lane routing
    if replies_owed:
        lane = "Reply Now"
    elif "tasting" in stage.lower() or "degust" in stage.lower():
        lane = "Tasting Push"
    elif fresh or new_lead:
        lane = "Call Push"
    elif follow_up:
        lane = "Follow Up"
    else:
        lane = "Nurture"

    why_now = None
    if replies_owed:
        why_now = "Lead sent the last message — André owes a reply."
    elif fresh:
        why_now = f"Lead was active {d_updated} day(s) ago — momentum window open."
    elif new_lead:
        why_now = "Newly assigned lead — start the cadence."

    return {
        "type": "crm",
        "leadId": lead_id,
        "leadName": lead_name,
        "title": lead_name,
        "statusBucket": bucket,
        "score": score,
        "stage": stage,
        "recommendedAction": lane.lower(),
        "recommendedLane": lane,
        "section": lane,
        "whyNow": why_now,
        "reviewNextStep": None,
        "rationale": [why_now] if why_now else [],
        "cadenceStep": None,
        "cadenceActive": bucket == "Hot",
        "assignmentFreshness": "Today" if d_updated == 0 else ("This week" if d_updated and d_updated <= 7 else "Older"),
        "nextStepDue": None,
        "bestCallSlot": "6:30 PM",
        "link": to_close_url(lead_id),
    }


def load_slack() -> dict:
    try:
        raw = json.loads(SLACK_CACHE.read_text(encoding="utf-8"))
        items = raw if isinstance(raw, list) else raw.get("signals", [])
        reply_now, assigned, mentions = [], [], []
        for item in items:
            t = item.get("type", "")
            entry = {
                "type": "slack",
                "leadId": None,
                "leadName": item.get("item", "Slack signal"),
                "title": item.get("item", "Slack signal"),
                "statusBucket": "Watch",
                "score": 130 if t == "reply_now" else 120 if t == "assigned_to_andre" else 90,
                "recommendedAction": item.get("nextMove", "Review"),
                "recommendedLane": t.replace("_", " ").title(),
                "stage": f"Slack #{item.get('channelLabel', 'channel')}",
                "whyNow": item.get("reason", ""),
                "reviewNextStep": item.get("nextMove", ""),
                "rationale": [item.get("reason", "")],
                "link": None,
            }
            if t == "reply_now":
                reply_now.append(entry)
            elif t == "assigned_to_andre":
                assigned.append(entry)
            else:
                mentions.append(entry)
        return {"replyNow": reply_now, "assignedToAndre": assigned, "mentions": mentions}
    except Exception:
        return {"replyNow": [], "assignedToAndre": [], "mentions": []}


def build_call_slots(call_push: list) -> list:
    slots = ["10:00 AM", "11:30 AM", "1:00 PM", "3:00 PM", "5:00 PM", "6:30 PM"]
    result = []
    for i, slot in enumerate(slots):
        a = call_push[i] if i < len(call_push) else None
        result.append({
            "slot": slot,
            "status": "Booked" if a else "Open",
            "assignedLead": a["leadName"] if a else None,
            "fallbackCandidates": [{"leadName": l["leadName"]} for l in (call_push[i+1:i+3] if not a else [])],
        })
    return result


# ─── LIVE DATA BUILDER ───────────────────────────────────

def build_live_data() -> dict:
    """Pull live data from Close + Slack and classify leads. ~30-90s."""
    client = CloseClient()

    # Fetch André's leads (2 API calls)
    all_recent = client.get_recent_leads()
    andre_leads = [l for l in all_recent if is_andres(l)]

    # Fetch activities for leads active in last 60 days (parallel-ish via quick single calls)
    cutoff = datetime.now(UTC) - timedelta(days=60)
    active = [
        l for l in andre_leads
        if (parse_dt(l.get("date_updated")) or datetime.min.replace(tzinfo=UTC)) > cutoff
    ]

    activities_by_lead: dict[str, list] = {}
    for lead in active[:40]:  # cap at 40 for speed
        try:
            acts = client.get_recent_activities(lead["id"], limit=8)
            activities_by_lead[lead["id"]] = acts
        except Exception:
            activities_by_lead[lead["id"]] = []

    # Classify each lead
    classified = []
    for lead in andre_leads:
        acts = activities_by_lead.get(lead["id"], [])
        classified.append(classify_lead(lead, acts))

    classified.sort(key=lambda x: -x["score"])

    # Bucket into lanes
    replies_owed  = [l for l in classified if l["recommendedLane"] == "Reply Now"]
    call_push     = [l for l in classified if l["recommendedLane"] == "Call Push"]
    tasting_push  = [l for l in classified if l["recommendedLane"] == "Tasting Push"]
    follow_up     = [l for l in classified if l["recommendedLane"] == "Follow Up"]
    nurture       = [l for l in classified if l["recommendedLane"] == "Nurture"]
    won_closed    = [l for l in classified if "Won" in l["stage"] or "Closed" in l["stage"] or "Lost" in l["stage"]]

    # Top focus: highest-priority items across reply + call + tasting
    top_focus = sorted(replies_owed + call_push[:3] + tasting_push[:2], key=lambda x: -x["score"])[:6]

    slack      = load_slack()
    call_slots = build_call_slots(call_push)

    # Freshness labels
    recently_assigned = [l for l in classified if l["assignmentFreshness"] == "Today"]

    summary = {
        "repliesOwedNow": len(replies_owed),
        "callPushes": len(call_push),
        "tastingPushes": len(tasting_push),
        "nurtureQueue": len(nurture),
        "openCallSlotsToday": sum(1 for s in call_slots if s["status"] == "Open"),
        "recentlyAssigned": len(recently_assigned),
        "slackReplyNow": len(slack["replyNow"]),
        "slackAssignedToAndre": len(slack["assignedToAndre"]),
        "slackMentions": len(slack["mentions"]),
        "doNotTouch": len(won_closed),
        "holdRecentTouch": 0,
        "bookedOrClosed": len(won_closed),
        "archiveReview": 0,
        "weakContextReview": 0,
        "notYours": 0,
    }

    return {
        "generated_at": datetime.now(UTC).replace(microsecond=0).isoformat(),
        "source_file": "close_crm_live",
        "checkpoint": "live",
        "summary": summary,
        "topFocus": top_focus,
        "tastingTarget": "Goal: 3 tasting commitments per week.",
        "crm": {
            "repliesOwedNow": replies_owed,
            "callPushQueue": call_push,
            "tastingPushQueue": tasting_push,
            "recentlyAssigned": recently_assigned,
            "endOfDayRollovers": [],
            "nurtureQueue": nurture,
            "doNotTouch": won_closed,
            "archiveReview": [],
            "activeCadence": [l for l in classified if l["cadenceActive"]][:10],
            "callSlots": call_slots,
        },
        "slack": slack,
        "squad": {
            "rawAi":      {"environment": "Raw AI",      "items": []},
            "acerbot":    {"environment": "Acerbot",     "items": []},
            "lenoRawbot": {"environment": "LenoRawbot",  "items": []},
        },
        "comparison": None,
    }


# ─── CACHE LAYER ─────────────────────────────────────────

def latest_json_age() -> float | None:
    """Return age in seconds of latest.json, or None if missing."""
    try:
        mtime = LATEST_JSON.stat().st_mtime
        return time.time() - mtime
    except FileNotFoundError:
        return None


def read_latest_json() -> dict | None:
    try:
        return json.loads(LATEST_JSON.read_text(encoding="utf-8"))
    except Exception:
        return None


def run_refresh_pipeline() -> bool:
    """Run the existing Node.js refresh pipeline if available. Returns True on success."""
    if not REFRESH_SCRIPT.exists():
        return False
    try:
        result = subprocess.run(
            ["node", str(REFRESH_SCRIPT)],
            cwd=str(ROOT),
            capture_output=True,
            timeout=180,
            env={**os.environ, "MISSION_CONTROL_FORCE_RUN": "1"},
        )
        return result.returncode == 0
    except Exception:
        return False


def run_agent_pipeline(agent_id: str) -> tuple[bool, str]:
    script = AGENT_SCRIPTS.get(agent_id)
    if script is None or not script.exists():
        return False, f"Unknown agent '{agent_id}'."
    try:
        result = subprocess.run(
            ["node", str(script)],
            cwd=str(ROOT),
            capture_output=True,
            timeout=240,
            env={**os.environ, "MISSION_CONTROL_FORCE_RUN": "1"},
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        output = (result.stdout or result.stderr or "").strip()
        return result.returncode == 0, output
    except Exception as exc:
        return False, str(exc)


def read_agent_state(agent_id: str) -> dict | None:
    path = AGENT_STATE_FILES.get(agent_id)
    if not path:
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def agent_snapshot() -> dict:
    return {
        agent_id: {
            "runtime": read_agent_state(agent_id),
            "script_exists": AGENT_SCRIPTS[agent_id].exists(),
        }
        for agent_id in AGENT_SCRIPTS
    }


_live_cache: dict = {"data": None, "at": 0.0}
LIVE_CACHE_TTL = 300  # 5 minutes for in-memory live data


def get_data() -> dict:
    """
    Return Mission Control data using stale-while-revalidate strategy:
    1. If latest.json exists and is fresh, serve it directly (fast)
    2. If latest.json is stale, serve stale + trigger background refresh
    3. If no latest.json, build live data in-process (slower first load)
    """
    age = latest_json_age()

    # Case 1: fresh file — serve immediately
    if age is not None and age < STALE_AFTER:
        data = read_latest_json()
        if data:
            return data

    # Case 2: stale file — serve stale + trigger background refresh
    if age is not None and age >= STALE_AFTER:
        data = read_latest_json()
        if data:
            trigger_background_refresh()
            return data

    # Case 3: no file at all — try in-process live build with in-memory cache
    now = time.time()
    if _live_cache["data"] and (now - _live_cache["at"]) < LIVE_CACHE_TTL:
        return _live_cache["data"]

    # Build it live (blocks until done — first-time only)
    data = build_live_data()
    _live_cache["data"] = data
    _live_cache["at"]   = now
    return data


def trigger_background_refresh() -> None:
    """Spawn background thread to refresh data — non-blocking."""
    global _refreshing
    with _refresh_lock:
        if _refreshing:
            return
        _refreshing = True

    def _worker():
        global _refreshing
        try:
            # Try Node.js pipeline first
            if not run_refresh_pipeline():
                # Fallback: in-process live build
                data = build_live_data()
                _live_cache["data"] = data
                _live_cache["at"]   = time.time()
        except Exception:
            pass
        finally:
            with _refresh_lock:
                _refreshing = False

    threading.Thread(target=_worker, daemon=True).start()


# ─── ROUTES ──────────────────────────────────────────────

@app.route("/")
def index():
    return send_file(str(HTML_PATH))


@app.route("/oracle-enrichment-dossier")
@app.route("/oracle-enrichment-dossier.html")
def oracle_enrichment_dossier():
    return send_file(str(ORACLE_PATH))


@app.route("/mission-control-andre1")
@app.route("/mission-control-andre1.html")
def andre_intel_page():
    return send_file(str(ANDRE_INTEL_PATH))


@app.route("/mission-control-data/latest.json")
def mission_data():
    """The HTML fetches this URL to populate the dashboard."""
    try:
        data = get_data()
        payload = json.dumps(data, ensure_ascii=False)
    except Exception as exc:
        payload = json.dumps({"error": str(exc).encode("ascii", "replace").decode("ascii")})
    response = Response(payload, mimetype="application/json")
    response.headers["Cache-Control"] = "no-store"
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response


@app.route("/api/refresh")
def force_refresh():
    """Force-refresh data now and return a summary."""
    try:
        # Force in-process live build
        data = build_live_data()
        _live_cache["data"] = data
        _live_cache["at"]   = time.time()
        return jsonify({
            "status": "refreshed",
            "generated_at": data.get("generated_at"),
            "andre_leads": len(data.get("crm", {}).get("repliesOwedNow", [])) +
                           len(data.get("crm", {}).get("callPushQueue", [])) +
                           len(data.get("crm", {}).get("nurtureQueue", [])),
            "summary": data.get("summary"),
        })
    except BaseException as exc:
        import traceback as _tb
        safe = _tb.format_exc().encode("ascii", "replace").decode("ascii")
        return Response(
            json.dumps({"status": "error", "error": safe}, ensure_ascii=True),
            status=500, mimetype="application/json",
        )


@app.route("/api/status")
def status():
    age = latest_json_age()
    return jsonify({
        "status": "ok",
        "latest_json_age_seconds": round(age, 1) if age is not None else None,
        "latest_json_exists": age is not None,
        "stale_threshold_seconds": STALE_AFTER,
        "is_refreshing": _refreshing,
        "live_cache_loaded": _live_cache["data"] is not None,
        "agents": agent_snapshot(),
    })


@app.route("/api/agents")
def agent_status():
    return jsonify({
        "status": "ok",
        "agents": agent_snapshot(),
    })


@app.route("/api/agents/<agent_id>/run", methods=["POST", "GET"])
def run_agent(agent_id: str):
    ok, output = run_agent_pipeline(agent_id)
    state = read_agent_state(agent_id)
    status_code = 200 if ok else 500
    return jsonify({
        "status": "ok" if ok else "error",
        "agent": agent_id,
        "runtime": state,
        "output": output,
        "requested_via": request.method,
    }), status_code


@app.route("/api/test")
def test_crm():
    """Quick CRM connectivity test — fetches 1 lead."""
    try:
        client = CloseClient()
        page = client.get("lead/", _limit=1, _order_by="date_updated")
        count = len(page.get("data", []))
        return jsonify({"status": "ok", "close_api": "connected", "lead_count_sample": count})
    except BaseException as exc:
        safe = str(exc).encode("ascii", "replace").decode("ascii")
        return jsonify({"status": "error", "error": safe}), 500


# ─── BOOT ────────────────────────────────────────────────

if __name__ == "__main__":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    print()
    print("  === Mission Control Live Backend ===")
    print()
    print(f"  Dashboard : http://localhost:{PORT}")
    print(f"  Refresh   : http://localhost:{PORT}/api/refresh")
    print(f"  Status    : http://localhost:{PORT}/api/status")
    print(f"  CRM Test  : http://localhost:{PORT}/api/test")
    print()

    age = latest_json_age()
    if age is not None:
        print(f"  latest.json found — age: {round(age)}s")
        if age > STALE_AFTER:
            print("  Data is stale — will auto-refresh on first request.")
    else:
        print("  No latest.json found — first request will fetch live from Close CRM (~30-90s).")
    print()

    app.run(host="0.0.0.0", port=PORT, debug=False)
