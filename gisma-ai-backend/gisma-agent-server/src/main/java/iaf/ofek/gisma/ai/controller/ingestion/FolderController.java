package iaf.ofek.gisma.ai.controller.ingestion;


import iaf.ofek.gisma.ai.annotation.AdminOnly;
import iaf.ofek.gisma.ai.dto.ingestion.CreateFolderDTO;
import iaf.ofek.gisma.ai.service.ingestion.FolderService;
import iaf.ofek.gisma.ai.service.ingestion.ParentFolderFetcherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/ingestion/folders")
@RequiredArgsConstructor
@AdminOnly
@Validated
public class FolderController {

    private final FolderService folderService;

    private final ParentFolderFetcherService folderFetcherService;

    @GetMapping
    public ResponseEntity<?> getRootFolder() { // TODO: make reactive
        return ResponseEntity.status(HttpStatus.OK)
                .body(folderFetcherService.getRootFolder());
    }

    @PostMapping
    public ResponseEntity<?> createFolder(@RequestBody @Valid CreateFolderDTO createFolderDTO) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(folderService.createFolder(createFolderDTO));
    }

    @DeleteMapping
    public ResponseEntity<?> delete(@RequestBody List<UUID> ids) {
        folderService.deleteFolders(ids);

        return ResponseEntity.status(HttpStatus.NO_CONTENT)
                .build();
    }

}
