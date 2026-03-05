package iaf.ofek.gisma.ai.controller.ingestion;

import iaf.ofek.gisma.ai.annotation.AdminOnly;
import iaf.ofek.gisma.ai.entity.ingestion.S3Document;
import iaf.ofek.gisma.ai.service.ingestion.DocumentProcessor;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/ingestion/documents")
@RequiredArgsConstructor
@AdminOnly
@Validated
@Log4j2
public class DocumentController {

    private final DocumentProcessor documentProcessor;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createNewDocument(@RequestPart("files") List<MultipartFile> files,
                                               @RequestPart("parentFolderId") String parentFolderId, Principal user) {
        log.info("Uploading {} files.", files.size());
        String userId = user.getName();
        List<S3Document> results = documentProcessor.saveNewDocuments(files, UUID.fromString(parentFolderId), userId);
        log.info("Uploaded {} files successfully.", results.size());

        return ResponseEntity.status(HttpStatus.CREATED).body(results);
    }

    @PatchMapping(value = "/edit", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> editDocument(@RequestPart("file") MultipartFile file, @RequestPart("id") String id, Principal user) {
        String userId = user.getName();
        S3Document document = documentProcessor.editDocument(file, UUID.fromString(id), userId);

        return ResponseEntity.status(HttpStatus.OK).body(document);
    }


    @DeleteMapping
    public ResponseEntity<?> delete(@RequestBody List<UUID> ids) {
        documentProcessor.deleteDocuments(ids);

        return ResponseEntity.status(HttpStatus.NO_CONTENT)
                .build();
    }

}
