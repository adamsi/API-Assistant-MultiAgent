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