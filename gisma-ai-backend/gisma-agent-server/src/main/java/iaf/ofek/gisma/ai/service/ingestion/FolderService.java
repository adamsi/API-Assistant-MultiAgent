package iaf.ofek.gisma.ai.service.ingestion;

import iaf.ofek.gisma.ai.dto.ingestion.CreateFolderDTO;
import iaf.ofek.gisma.ai.entity.ingestion.S3Document;
import iaf.ofek.gisma.ai.entity.ingestion.S3Folder;
import iaf.ofek.gisma.ai.repository.S3FolderRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FolderService {

    private final S3FolderRepository s3FolderRepository;

    private final DocumentProcessor documentProcessor;

    private final ParentFolderFetcherService parentFolderFetcherService;

    @Transactional
    public S3Folder createFolder(CreateFolderDTO createFolderDTO) {
        S3Folder parentFolder = parentFolderFetcherService.getParentFolder(createFolderDTO.getParentFolderId());
        S3Folder newFolder = S3Folder.builder()
                .name(createFolderDTO.getName())
                .parentFolder(parentFolder)
                .build();

        return s3FolderRepository.save(newFolder);
    }

    @Transactional
    public void deleteFolders(List<UUID> ids) {
        for (UUID id : ids) {
            S3Folder folder = s3FolderRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Failed to find folder with id: " + id));

            if (!folder.getChildrenDocuments().isEmpty()) {
                List<UUID> docIds = folder.getChildrenDocuments()
                        .stream()
                        .map(S3Document::getId)
                        .toList();

                documentProcessor.deleteDocuments(docIds);
            }

            if (!folder.getChildrenFolders().isEmpty()) {
                List<UUID> childFolderIds = folder.getChildrenFolders()
                        .stream()
                        .map(S3Folder::getId)
                        .toList();

                deleteFolders(childFolderIds);
            }

            s3FolderRepository.delete(folder);
        }
    }

}
