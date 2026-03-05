DROP SCHEMA IF EXISTS gisma_agent CASCADE;
CREATE SCHEMA gisma_agent;

CREATE EXTENSION IF NOT EXISTS vector;


/* Global Context */

CREATE TABLE gisma_agent.document_vector_store (
    id UUID PRIMARY KEY,
    content TEXT,
    metadata JSONB,
    embedding vector(1536)
);

CREATE TABLE gisma_agent.s3_folders (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    parent_id UUID,
    CONSTRAINT fk_parent FOREIGN KEY (parent_id) REFERENCES gisma_agent.s3_folders (id)
);

CREATE TABLE gisma_agent.s3_documents (
    id UUID PRIMARY KEY,
    url TEXT,
    name VARCHAR(255),
    content_type VARCHAR(255),
    folder_id UUID,
    CONSTRAINT fk_folder FOREIGN KEY (folder_id) REFERENCES gisma_agent.s3_folders (id)
);

CREATE INDEX idx_s3_documents_folder_id ON gisma_agent.s3_documents(folder_id);
CREATE INDEX idx_s3_folders_parent_id ON gisma_agent.s3_folders(parent_id);


/* User Context */

CREATE TABLE gisma_agent.user_document_vector_store
(
    id        UUID PRIMARY KEY,
    content   TEXT,
    metadata  JSONB,
    embedding vector(1536)
);

CREATE TABLE gisma_agent.users (
    id UUID PRIMARY KEY,
    email          VARCHAR(255),
    password       VARCHAR(255),
    username       VARCHAR(255),
    oauth_provider VARCHAR(50),
    oauth_id       VARCHAR(255),
    role           VARCHAR(50),
    picture        TEXT
);

CREATE TABLE gisma_agent.user_s3_folders (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    parent_id UUID,
    CONSTRAINT fk_parent FOREIGN KEY (parent_id) REFERENCES gisma_agent.user_s3_folders (id)
);

CREATE TABLE gisma_agent.user_s3_documents (
    id UUID PRIMARY KEY,
    url TEXT,
    name VARCHAR(255),
    content_type VARCHAR(255),
    folder_id UUID,
    CONSTRAINT fk_folder FOREIGN KEY (folder_id) REFERENCES gisma_agent.user_s3_folders (id)
);

CREATE INDEX idx_user_s3_documents_folder_id ON gisma_agent.user_s3_documents(folder_id);
CREATE INDEX idx_user_s3_folders_parent_id ON gisma_agent.user_s3_folders(parent_id);



/* Chat Memory */

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE SEQUENCE gisma_agent.conversation_sequence START 1;

CREATE TABLE gisma_agent.chat_memory (
    conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    description VARCHAR(256),
    sequence_number BIGINT DEFAULT nextval('gisma_agent.conversation_sequence'),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES gisma_agent.users (id)
);

CREATE INDEX idx_chat_memory_user_id ON gisma_agent.chat_memory(user_id);



/* Gisma DB */

SET search_path TO gisma_agent;

-- Optional enums
DO $$ BEGIN
  CREATE TYPE season AS ENUM ('winter','spring','summer','autumn','all_year');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE climate AS ENUM ('tropical','subtropical','temperate','arid','continental','mediterranean');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Helper function for CHECK constraints (Postgres CHECK cannot contain subqueries)
CREATE OR REPLACE FUNCTION gisma_agent.int_array_all_between(arr int[], lo int, hi int)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(bool_and(x BETWEEN lo AND hi), false)
  FROM unnest(arr) AS t(x);
$$;

-- Core fruits table (PRIMARY KEY is name)
CREATE TABLE IF NOT EXISTS fruits (
  name              TEXT PRIMARY KEY,
  scientific_name   TEXT,
  family            TEXT NOT NULL,
  genus             TEXT,
  origin_region     TEXT,
  typical_climate   climate,
  is_hybrid         BOOLEAN NOT NULL DEFAULT FALSE,
  avg_weight_g      INT CHECK (avg_weight_g IS NULL OR avg_weight_g > 0),
  sweetness_brix    NUMERIC(4,1) CHECK (sweetness_brix IS NULL OR sweetness_brix >= 0),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Alternate names / synonyms (many per fruit)
CREATE TABLE IF NOT EXISTS fruit_synonyms (
  fruit_name   TEXT NOT NULL REFERENCES fruits(name) ON DELETE CASCADE,
  synonym      TEXT NOT NULL,
  locale       TEXT,
  PRIMARY KEY (fruit_name, synonym)
);

-- Nutrients catalog
CREATE TABLE IF NOT EXISTS nutrients (
  nutrient_id   BIGSERIAL PRIMARY KEY,
  code          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  unit          TEXT NOT NULL
);

-- Nutrition amounts per fruit (many-to-many)
CREATE TABLE IF NOT EXISTS fruit_nutrition (
  fruit_name    TEXT NOT NULL REFERENCES fruits(name) ON DELETE CASCADE,
  nutrient_id   BIGINT NOT NULL REFERENCES nutrients(nutrient_id) ON DELETE RESTRICT,
  amount        NUMERIC(10,3) NOT NULL CHECK (amount >= 0),
  PRIMARY KEY (fruit_name, nutrient_id)
);

-- Cultivars/varieties
CREATE TABLE IF NOT EXISTS cultivars (
  cultivar_id     BIGSERIAL PRIMARY KEY,
  fruit_name      TEXT NOT NULL REFERENCES fruits(name) ON DELETE CASCADE,
  cultivar_name   TEXT NOT NULL,
  main_color      TEXT,
  seasonality     season NOT NULL DEFAULT 'all_year',
  notes           TEXT,
  UNIQUE (fruit_name, cultivar_name)
);

-- Countries/regions for availability
CREATE TABLE IF NOT EXISTS countries (
  country_code   CHAR(2) PRIMARY KEY,
  name           TEXT NOT NULL UNIQUE
);

-- Many-to-many fruit availability by country + months
CREATE TABLE IF NOT EXISTS fruit_availability (
  fruit_name     TEXT NOT NULL REFERENCES fruits(name) ON DELETE CASCADE,
  country_code   CHAR(2) NOT NULL REFERENCES countries(country_code) ON DELETE RESTRICT,
  months         INT[] NOT NULL, -- 1..12
  PRIMARY KEY (fruit_name, country_code),
  CONSTRAINT months_valid CHECK (
    array_length(months, 1) IS NOT NULL
    AND gisma_agent.int_array_all_between(months, 1, 12)
  )
);

-- Taste notes / flavor tags
CREATE TABLE IF NOT EXISTS flavor_tags (
  tag_id   BIGSERIAL PRIMARY KEY,
  tag      TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS fruit_flavor (
  fruit_name  TEXT NOT NULL REFERENCES fruits(name) ON DELETE CASCADE,
  tag_id      BIGINT NOT NULL REFERENCES flavor_tags(tag_id) ON DELETE RESTRICT,
  intensity   INT NOT NULL CHECK (intensity BETWEEN 1 AND 5),
  PRIMARY KEY (fruit_name, tag_id)
);

-- Allergens / sensitivities (labeling only)
CREATE TABLE IF NOT EXISTS allergens (
  allergen_id  BIGSERIAL PRIMARY KEY,
  name         TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS fruit_allergen_links (
  fruit_name   TEXT NOT NULL REFERENCES fruits(name) ON DELETE CASCADE,
  allergen_id  BIGINT NOT NULL REFERENCES allergens(allergen_id) ON DELETE RESTRICT,
  note         TEXT,
  PRIMARY KEY (fruit_name, allergen_id)
);

-- “Pairs well with” (fruit-to-fruit graph)
CREATE TABLE IF NOT EXISTS fruit_pairings (
  fruit_a    TEXT NOT NULL REFERENCES fruits(name) ON DELETE CASCADE,
  fruit_b    TEXT NOT NULL REFERENCES fruits(name) ON DELETE CASCADE,
  reason     TEXT,
  PRIMARY KEY (fruit_a, fruit_b),
  CONSTRAINT no_self_pair CHECK (fruit_a <> fruit_b)
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_fruits_family ON fruits(family);
CREATE INDEX IF NOT EXISTS idx_fruits_climate ON fruits(typical_climate);
CREATE INDEX IF NOT EXISTS idx_cultivars_fruit ON cultivars(fruit_name);
CREATE INDEX IF NOT EXISTS idx_synonyms_syn ON fruit_synonyms(synonym);

-- =========================
-- DATA
-- =========================

-- Fruits
INSERT INTO fruits (name, scientific_name, family, genus, origin_region, typical_climate, is_hybrid, avg_weight_g, sweetness_brix)
VALUES
('apple',      'Malus domestica',            'Rosaceae',     'Malus',    'Central Asia',        'temperate',     FALSE, 180, 12.5),
('pear',       'Pyrus communis',             'Rosaceae',     'Pyrus',    'Europe/West Asia',    'temperate',     FALSE, 180, 12.0),
('strawberry', 'Fragaria × ananassa',        'Rosaceae',     'Fragaria', 'Europe',             'temperate',     TRUE,   15,  7.5),
('orange',     'Citrus × sinensis',          'Rutaceae',     'Citrus',   'China',              'subtropical',   TRUE,  200, 11.0),
('lemon',      'Citrus limon',               'Rutaceae',     'Citrus',   'South Asia',         'subtropical',   TRUE,  120,  2.5),
('banana',     'Musa acuminata',             'Musaceae',     'Musa',     'Southeast Asia',     'tropical',      FALSE, 120, 14.0),
('mango',      'Mangifera indica',           'Anacardiaceae','Mangifera','South Asia',         'tropical',      FALSE, 250, 15.0),
('pineapple',  'Ananas comosus',             'Bromeliaceae', 'Ananas',   'South America',      'tropical',      FALSE, 900, 13.0),
('grape',      'Vitis vinifera',             'Vitaceae',     'Vitis',    'Mediterranean',      'mediterranean', FALSE,   5, 16.0),
('kiwi',       'Actinidia deliciosa',        'Actinidiaceae','Actinidia','China',             'temperate',     FALSE,  90, 14.5)
ON CONFLICT (name) DO NOTHING;

-- Synonyms
INSERT INTO fruit_synonyms (fruit_name, synonym, locale) VALUES
('apple', 'malus', 'la'),
('orange', 'sweet orange', 'en'),
('banana', 'plantain', 'en'),
('kiwi', 'kiwifruit', 'en')
ON CONFLICT DO NOTHING;

-- Countries
INSERT INTO countries (country_code, name) VALUES
('IL','Israel'),
('ES','Spain'),
('BR','Brazil'),
('IN','India'),
('US','United States'),
('CN','China'),
('ZA','South Africa')
ON CONFLICT DO NOTHING;

-- Availability (months)
INSERT INTO fruit_availability (fruit_name, country_code, months) VALUES
('apple','IL', ARRAY[9,10,11,12,1,2,3]),
('orange','ES', ARRAY[11,12,1,2,3,4]),
('banana','BR', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]),
('mango','IN', ARRAY[4,5,6,7]),
('grape','ZA', ARRAY[1,2,3,4]),
('kiwi','CN', ARRAY[10,11,12,1])
ON CONFLICT DO NOTHING;

-- Nutrients
INSERT INTO nutrients (code, name, unit) VALUES
('VITC','Vitamin C','mg/100g'),
('FIBER','Dietary fiber','g/100g'),
('K','Potassium','mg/100g'),
('SUGAR','Total sugars','g/100g')
ON CONFLICT (code) DO NOTHING;

-- Fruit nutrition (example values)
INSERT INTO fruit_nutrition (fruit_name, nutrient_id, amount)
SELECT 'orange', n.nutrient_id,
       CASE n.code
         WHEN 'VITC' THEN 53.2
         WHEN 'FIBER' THEN 2.4
         WHEN 'K' THEN 181
         WHEN 'SUGAR' THEN 9.4
       END
FROM nutrients n
WHERE n.code IN ('VITC','FIBER','K','SUGAR')
ON CONFLICT DO NOTHING;

INSERT INTO fruit_nutrition (fruit_name, nutrient_id, amount)
SELECT 'apple', n.nutrient_id,
       CASE n.code
         WHEN 'VITC' THEN 4.6
         WHEN 'FIBER' THEN 2.4
         WHEN 'K' THEN 107
         WHEN 'SUGAR' THEN 10.4
       END
FROM nutrients n
WHERE n.code IN ('VITC','FIBER','K','SUGAR')
ON CONFLICT DO NOTHING;

INSERT INTO fruit_nutrition (fruit_name, nutrient_id, amount)
SELECT 'banana', n.nutrient_id,
       CASE n.code
         WHEN 'VITC' THEN 8.7
         WHEN 'FIBER' THEN 2.6
         WHEN 'K' THEN 358
         WHEN 'SUGAR' THEN 12.2
       END
FROM nutrients n
WHERE n.code IN ('VITC','FIBER','K','SUGAR')
ON CONFLICT DO NOTHING;

-- Cultivars
INSERT INTO cultivars (fruit_name, cultivar_name, main_color, seasonality, notes) VALUES
('apple','Granny Smith','green','autumn','tart, crisp'),
('apple','Gala','red/yellow','autumn','sweet, aromatic'),
('orange','Navel','orange','winter','seedless, easy peel'),
('mango','Alphonso','yellow','summer','rich aroma'),
('grape','Thompson Seedless','green','summer','table grape/raisins')
ON CONFLICT DO NOTHING;

-- Flavor tags
INSERT INTO flavor_tags (tag) VALUES
('sweet'),('tart'),('citrusy'),('floral'),('tropical'),('berry-like'),('herbal')
ON CONFLICT DO NOTHING;

-- Fruit flavor mapping
INSERT INTO fruit_flavor (fruit_name, tag_id, intensity)
SELECT 'lemon', t.tag_id, 5
FROM flavor_tags t
WHERE t.tag='citrusy'
ON CONFLICT DO NOTHING;

INSERT INTO fruit_flavor (fruit_name, tag_id, intensity)
SELECT 'apple', t.tag_id, 4
FROM flavor_tags t
WHERE t.tag='sweet'
ON CONFLICT DO NOTHING;

INSERT INTO fruit_flavor (fruit_name, tag_id, intensity)
SELECT 'apple', t.tag_id, 3
FROM flavor_tags t
WHERE t.tag='tart'
ON CONFLICT DO NOTHING;

INSERT INTO fruit_flavor (fruit_name, tag_id, intensity)
SELECT 'mango', t.tag_id, 5
FROM flavor_tags t
WHERE t.tag='tropical'
ON CONFLICT DO NOTHING;

-- Allergens
INSERT INTO allergens (name) VALUES
('latex-fruit syndrome'),
('oral allergy syndrome')
ON CONFLICT DO NOTHING;

INSERT INTO fruit_allergen_links (fruit_name, allergen_id, note)
SELECT 'banana', a.allergen_id, 'May cross-react in some cases'
FROM allergens a
WHERE a.name='latex-fruit syndrome'
ON CONFLICT DO NOTHING;

-- Pairings (directed)
INSERT INTO fruit_pairings (fruit_a, fruit_b, reason) VALUES
('apple','pear','similar texture; complementary sweetness'),
('mango','pineapple','tropical blend; balanced acidity'),
('strawberry','banana','classic smoothie pairing'),
('orange','kiwi','bright citrus + tangy fruit')
ON CONFLICT DO NOTHING;

