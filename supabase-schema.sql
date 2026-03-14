-- Properties table
CREATE TABLE properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  property_type TEXT NOT NULL, -- apartamento, kitnet, loft, cobertura, duplex, triplex, casa, casa-condominio, sala-comercial, loja, ponto-comercial, galpao, predio-comercial, terreno, lote, loteamento, garagem, hotel-flat
  listing_type TEXT NOT NULL CHECK (listing_type IN ('aluguel', 'venda', 'ambos')),
  price DECIMAL(12,2),
  price_condo DECIMAL(10,2), -- condomínio fee
  area_m2 DECIMAL(8,2),
  bedrooms INTEGER,
  bathrooms INTEGER,
  parking_spots INTEGER,
  address TEXT,
  neighborhood TEXT, -- Águas Claras Norte, Sul, etc.
  city TEXT DEFAULT 'Brasília',
  state TEXT DEFAULT 'DF',
  zip_code TEXT,
  condominium_name TEXT, -- nome do condomínio/prédio
  floor INTEGER,
  features TEXT[], -- array of features like 'piscina', 'academia', 'churrasqueira'
  photos TEXT[], -- array of photo URLs
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Contact submissions
CREATE TABLE contact_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  subject TEXT,
  message TEXT,
  property_id UUID REFERENCES properties(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Public read access for properties
CREATE POLICY "Public can view active properties" ON properties
  FOR SELECT USING (is_active = true);

-- Public can submit contacts
CREATE POLICY "Anyone can submit contact" ON contact_submissions
  FOR INSERT WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_properties_type ON properties(property_type);
CREATE INDEX idx_properties_listing ON properties(listing_type);
CREATE INDEX idx_properties_neighborhood ON properties(neighborhood);
CREATE INDEX idx_properties_active ON properties(is_active);
CREATE INDEX idx_properties_search ON properties USING gin(to_tsvector('portuguese', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(address,'') || ' ' || coalesce(condominium_name,'') || ' ' || coalesce(neighborhood,'')));

-- Insert sample properties (from existing demo cards)
INSERT INTO properties (title, property_type, listing_type, price, area_m2, bedrooms, bathrooms, address, neighborhood, condominium_name, is_featured) VALUES
('Apartamento 3 quartos - Rua 25 Sul', 'apartamento', 'aluguel', 3200, 85, 3, 2, 'Rua 25 Sul, Águas Claras', 'Águas Claras Sul', 'Residencial Park Sul', true),
('Apartamento 2 quartos - Avenida Sibipiruna', 'apartamento', 'venda', 650000, 72, 2, 2, 'Avenida Sibipiruna, Águas Claras', 'Águas Claras Norte', 'Edifício Sibipiruna', true),
('Cobertura Duplex - Rua 12 Norte', 'cobertura', 'venda', 1200000, 145, 4, 3, 'Rua 12 Norte, Águas Claras', 'Águas Claras Norte', 'Residencial Norte Premium', true),
('Sala Comercial - Edifício Office Tower', 'sala-comercial', 'aluguel', 2800, 45, 0, 1, 'Avenida Araucárias, Águas Claras', 'Águas Claras Sul', 'Office Tower', true),
('Apartamento 1 quarto - Rua 3 Sul', 'apartamento', 'aluguel', 1800, 42, 1, 1, 'Rua 3 Sul, Águas Claras', 'Águas Claras Sul', 'Residencial Compact', true),
('Casa em Condomínio - Park Way', 'casa-condominio', 'venda', 1800000, 250, 4, 4, 'SMPW Quadra 17, Park Way', 'Park Way', 'Condomínio Mansões Park Way', true);