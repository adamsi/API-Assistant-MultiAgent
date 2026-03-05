package iaf.ofek.gisma.ai.entity.ingestion;

import com.fasterxml.jackson.annotation.JsonBackReference;
import iaf.ofek.gisma.ai.entity.GismaAiEntity;
import jakarta.persistence.*;
import lombok.*;

import static iaf.ofek.gisma.ai.constant.DBTableNames.S3_DOCUMENTS;
import static iaf.ofek.gisma.ai.constant.DBTableNames.S3_FOLDERS;

@Entity
@Table(name = S3_DOCUMENTS)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class S3Document extends GismaAiEntity {

    @Column
    private String url;

    @Column
    private String name;

    @Column(name = "content_type")
    private String contentType;

    @ManyToOne
    @JoinColumn(name = "folder_id")
    @JsonBackReference(value = "folder-document")
    private S3Folder parentFolder;

}
