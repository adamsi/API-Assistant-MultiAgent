package iaf.ofek.gisma.ai.repository;

import iaf.ofek.gisma.ai.entity.ingestion.S3Folder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface S3FolderRepository extends JpaRepository<S3Folder, UUID> {

    @Query("""
                SELECT DISTINCT f FROM S3Folder f  
                    LEFT JOIN FETCH f.childrenFolders  
                WHERE f.name = '/'
            """)
    Optional<S3Folder> findRootFolderWithChildrenFolders();


    @Query("""
                SELECT DISTINCT f FROM S3Folder f  
                    LEFT JOIN FETCH f.childrenDocuments  
                WHERE f.name = '/'
            """)
    Optional<S3Folder> findRootFolderWithChildrenDocuments();


    @Query("SELECT f FROM S3Folder f WHERE f.name = '/'")
    Optional<S3Folder> findRootFolder();

}
