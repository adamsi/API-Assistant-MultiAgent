package iaf.ofek.gisma.ai.entity.ingestion;

import com.fasterxml.jackson.annotation.JsonBackReference;
import iaf.ofek.gisma.ai.entity.GismaAiEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

import static iaf.ofek.gisma.ai.constant.DBTableNames.S3_FOLDERS;

@Entity
@Table(name = S3_FOLDERS)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class S3Folder extends GismaAiEntity {

    @Column
    private String name;

    @ManyToOne
    @JoinColumn(name = "parent_id")
    @JsonBackReference(value = "folder-folder")
    private S3Folder parentFolder;

    @OneToMany(mappedBy = "parentFolder", cascade = CascadeType.ALL)
    private List<S3Folder> childrenFolders = new ArrayList<>();

    @OneToMany(mappedBy = "parentFolder", cascade = CascadeType.ALL)
    private List<S3Document> childrenDocuments = new ArrayList<>();

}