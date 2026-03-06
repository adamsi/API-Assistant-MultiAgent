package iaf.ofek.gisma.ai.entity.auth;

import com.fasterxml.jackson.annotation.JsonIgnore;
import iaf.ofek.gisma.ai.entity.GismaAiEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "users")
@NoArgsConstructor
@ToString
@Getter
@Setter
public class User extends GismaAiEntity {

    @Column(nullable = false, unique = true)
    private String username;

    @Column
    @JsonIgnore
    private String password;

    @Column
    private String email;

    @Column
    private String oauthProvider;

    @Column
    private String oauthId;

    @Column
    private String picture;

    @Enumerated(value = EnumType.STRING)
    private Role role;

}
