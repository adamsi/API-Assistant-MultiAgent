package iaf.ofek.gisma.ai.service.ingestion;

import iaf.ofek.gisma.ai.entity.ingestion.S3Document;
import lombok.extern.log4j.Log4j2;
import org.apache.tika.Tika;
import org.apache.tika.exception.TikaException;
import org.springframework.ai.document.Document;
import org.springframework.ai.transformer.splitter.TextSplitter;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;

@Component
@Log4j2
@Validated
public class IngestionService {

    public static final String USER_ID = "userId";
    public static final String FILENAME = "filename";
    public static final String CONTENT_TYPE = "contentType";
    public static final String DOCUMENT_ID = "documentId";

    private static final Tika tika = new Tika();

    private static final TextSplitter textSplitter = new TokenTextSplitter();

    private final VectorStore documentVectorStore;

    public IngestionService(@Qualifier("documentVectorStore") VectorStore documentVectorStore) {
        this.documentVectorStore = documentVectorStore;
    }

    public void ingestToVectorStore(MultipartFile file, S3Document s3Document, String userId) {
        String filename = file.getOriginalFilename();
        if (filename == null) {
            throw new IllegalArgumentException("Failed processing file without filename");
        }

        try (InputStream inputStream = file.getInputStream()) {
            byte[] fileBytes = inputStream.readAllBytes();
            String contentType = tika.detect(fileBytes);
            String extractedText = tika.parseToString(new ByteArrayInputStream(fileBytes));

            if (extractedText != null && !extractedText.trim().isEmpty()) {
                Document document = new Document(extractedText, Map.of(
                        DOCUMENT_ID, s3Document.getId(),
                        USER_ID, userId,
                        FILENAME, filename,
                        CONTENT_TYPE, contentType
                ));

                    deleteDocument(s3Document); // remove old embeddings + file
                List<Document> chunks = textSplitter.apply(List.of(document));
                documentVectorStore.add(chunks);
            }
        } catch (IOException | TikaException e) {
            log.warn("Failed to ingest file {}: {}", filename, e.getMessage());
        }
    }

    public void deleteDocument(S3Document document) {
        documentVectorStore.delete("%s == '%s'".formatted(DOCUMENT_ID, document.getId()));
    }

}