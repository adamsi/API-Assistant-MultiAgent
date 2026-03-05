package iaf.ofek.gisma.ai.repository;

import iaf.ofek.gisma.ai.entity.ingestion.S3Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface S3DocumentRepository extends JpaRepository<S3Document, UUID> {
}
