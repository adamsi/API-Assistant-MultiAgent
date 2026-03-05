package iaf.ofek.gisma.ai.service.ingestion;

import iaf.ofek.gisma.ai.dto.ingestion.CreateDocumentDTO;
import iaf.ofek.gisma.ai.entity.ingestion.S3Document;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Log4j2
public class DocumentProcessor {

    private final DocumentService documentService;

    public List<S3Document> saveNewDocuments(List<MultipartFile> files, UUID parentFolderId, String userId) {
        List<CreateDocumentDTO> documents = files.stream()
                .map(file -> new CreateDocumentDTO(parentFolderId, file))
                .toList();

        return documentService.createNewDocuments(documents, userId);
    }

    public S3Document editDocument(MultipartFile file, UUID documentId, String userId) {
        return documentService.editDocument(file, documentId, userId);
    }

    public void deleteDocuments(List<UUID> ids) {
        documentService.deleteDocuments(ids);
    }

}
