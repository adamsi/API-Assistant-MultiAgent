package iaf.ofek.gisma.ai.service.ingestion;

import iaf.ofek.gisma.ai.entity.ingestion.S3Folder;
import iaf.ofek.gisma.ai.repository.S3FolderRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ParentFolderFetcherService {

    private final S3FolderRepository s3FolderRepository;

    public S3Folder getParentFolder(UUID id) {
        if (id == null) {
            return getRootFolder();
        }

        return s3FolderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("folder with id: `%s` not found".formatted(id)));
    }

    public S3Folder getRootFolder() {
        S3Folder rootFolder = s3FolderRepository.findRootFolderWithChildrenFolders()
                .orElseThrow(() -> new EntityNotFoundException("root folder not found"));

        s3FolderRepository.findRootFolderWithChildrenDocuments()
                .ifPresent(f -> rootFolder.setChildrenDocuments(f.getChildrenDocuments()));

        return rootFolder;
    }

}
