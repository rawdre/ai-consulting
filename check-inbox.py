#!/usr/bin/env python3
"""Check rawandre@gmail.com for new AI Audit form submissions."""
import imaplib
import email
import json
import os
import re
from email.header import decode_header
from html.parser import HTMLParser

class TableParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_td = False
        self.in_pre = False
        self.cells = []
        self.current = ''
    
    def handle_starttag(self, tag, attrs):
        if tag == 'td': self.in_td = True; self.current = ''
        if tag == 'pre': self.in_pre = True
    
    def handle_endtag(self, tag):
        if tag == 'td': self.in_td = False; self.cells.append(self.current.strip())
        if tag == 'pre': self.in_pre = False
    
    def handle_data(self, data):
        if self.in_td or self.in_pre:
            self.current += data

def check_new_audits():
    mail = imaplib.IMAP4_SSL('imap.gmail.com')
    mail.login('rawandre@gmail.com', 'bcgnjynsmmqdxhts')
    mail.select('inbox')
    
    # Search for unread FormSubmit audit emails
    status, messages = mail.search(None, '(UNSEEN FROM "submissions@formsubmit.co" SUBJECT "AI Audit")')
    ids = messages[0].split() if messages[0] else []
    
    results = []
    for mid in ids:
        status, msg_data = mail.fetch(mid, '(RFC822)')
        msg = email.message_from_bytes(msg_data[0][1])
        
        # Parse HTML body
        for part in msg.walk():
            if part.get_content_type() == 'text/html':
                html = part.get_payload(decode=True).decode(errors='replace')
                parser = TableParser()
                parser.feed(html)
                
                # Pair cells as key-value
                data = {}
                for i in range(0, len(parser.cells)-1, 2):
                    data[parser.cells[i]] = parser.cells[i+1]
                
                results.append({
                    'date': msg['Date'],
                    'subject': str(msg['Subject']),
                    'fields': data
                })
                break
    
    mail.logout()
    
    if results:
        print(json.dumps(results, indent=2, ensure_ascii=False))
    else:
        print("NO_NEW_AUDITS")

if __name__ == '__main__':
    check_new_audits()
