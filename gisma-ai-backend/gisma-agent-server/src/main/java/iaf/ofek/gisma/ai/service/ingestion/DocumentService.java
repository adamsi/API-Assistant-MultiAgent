package iaf.ofek.gisma.ai.service.ingestion;

import iaf.ofek.gisma.ai.dto.ingestion.CreateDocumentDTO;
import iaf.ofek.gisma.ai.entity.ingestion.S3Document;
import iaf.ofek.gisma.ai.repository.S3DocumentRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Log4j2
public class DocumentService {

    private final S3DocumentRepository s3DocumentRepository;

    private final ParentFolderFetcherService parentFolderFetcherService;

    private final IngestionService ingestionService;

    private final S3Service s3Service;

    @Transactional
    public List<S3Document> createNewDocuments(List<CreateDocumentDTO> documents, String userId) {
        return documents.stream()
                .map(document -> {
                    validateFile(document.getFile());

                    try {
                        return createNewDocument(document, userId);
                    } catch (Exception e) {
                        log.warn("Failed processing files: {}.", e.getMessage());
                        throw new IllegalArgumentException("Failed processing files, try again...");
                    }
                })
                .toList();
    }

    @Transactional
    public void deleteDocuments(List<UUID> documentIds) {
        List<S3Document> documents = s3DocumentRepository.findAllById(documentIds);
        s3DocumentRepository.deleteAll(documents);
        documents.forEach(documentEntity -> {
            ingestionService.deleteDocument(documentEntity);
            s3Service.deleteFile(documentEntity.getUrl());
        });
    }

    @Transactional
    public S3Document editDocument(MultipartFile file, UUID documentId, String userId) {
        validateFile(file);

        var documentEntity = s3DocumentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document with id: `%s` not found".formatted(documentId)));
        s3Service.deleteFile(documentEntity.getUrl());
        String url = s3Service.uploadFile(file);
        documentEntity.setUrl(url);
        documentEntity.setName(file.getOriginalFilename());
        documentEntity.setContentType(file.getContentType());
        ingestionService.deleteDocument(documentEntity);
        ingestionService.ingestToVectorStore(file, documentEntity, userId);

        return s3DocumentRepository.save(documentEntity);
    }

    private S3Document createNewDocument(CreateDocumentDTO document, String userId) {
        var file = document.getFile();
        var parentFolder = parentFolderFetcherService.getParentFolder(document.getParentFolderId());
        S3Document s3Document = S3Document.builder()
                .name(file.getOriginalFilename())
                .contentType(file.getContentType())
                .parentFolder(parentFolder)
                .build();
        s3Document = s3DocumentRepository.save(s3Document);
        ingestionService.ingestToVectorStore(file, s3Document, userId);
        String url = s3Service.uploadFile(file);
        s3Document.setUrl(url);

        return s3Document;
    }


    private void validateFile(MultipartFile file) {
        Set<String> allowedTypes = Set.of(
                "application/pdf",
                "text/plain",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/vnd.oasis.opendocument.text"
        );

        if (file.isEmpty() || file.getContentType() == null) {
            throw new IllegalArgumentException("Uploaded file is empty");
        }

        if (!allowedTypes.contains(file.getContentType())) {
            throw new IllegalArgumentException("Uploaded file contentType is not supported");
        }

    }

}
