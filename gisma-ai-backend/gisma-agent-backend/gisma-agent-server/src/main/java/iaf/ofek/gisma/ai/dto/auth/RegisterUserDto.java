package iaf.ofek.gisma.ai.dto.auth;

import lombok.Data;

import javax.validation.constraints.NotNull;

@Data
public class RegisterUserDto {

    @NotNull(message = "can't be null")
    private String username;

    private String email;

    @NotNull(message = "can't be null")
    private String password;
}

