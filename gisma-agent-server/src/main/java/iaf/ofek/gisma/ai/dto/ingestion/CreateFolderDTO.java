package iaf.ofek.gisma.ai.dto.ingestion;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotNull;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateFolderDTO {

    @NotNull(message = "can't be null")
    private String name;

    private UUID parentFolderId;

}
