package iaf.ofek.gisma.ai.config;

import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.pgvector.PgVectorStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import static iaf.ofek.gisma.ai.constant.DBTableNames.DOCUMENT_VECTOR_STORE;
import static iaf.ofek.gisma.ai.constant.DBTableNames.USER_DOCUMENT_VECTOR_STORE;

@Configuration
public class DocumentVectorStoreConfig {

    @Value("${spring.ai.vectorstore.pgvector.schema-name}")
    private String schema;

    @Bean("userDocumentVectorStore")
    public VectorStore userDocumentVectorStore(JdbcTemplate jdbcTemplate, EmbeddingModel embeddingModel) {
        return PgVectorStore.builder(jdbcTemplate, embeddingModel)
                .schemaName(schema)
                .vectorTableName(USER_DOCUMENT_VECTOR_STORE)
                .build();
    }

    @Bean("documentVectorStore")
    public VectorStore documentVectorStore(JdbcTemplate jdbcTemplate, EmbeddingModel embeddingModel) {
        return PgVectorStore.builder(jdbcTemplate, embeddingModel)
                .schemaName(schema)
                .vectorTableName(DOCUMENT_VECTOR_STORE)
                .build();
    }

}
