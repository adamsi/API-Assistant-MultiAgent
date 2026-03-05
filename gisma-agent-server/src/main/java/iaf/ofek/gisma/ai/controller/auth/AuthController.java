package iaf.ofek.gisma.ai.controller.auth;

import iaf.ofek.gisma.ai.dto.auth.LoginUserDto;
import iaf.ofek.gisma.ai.dto.auth.RegisterUserDto;
import iaf.ofek.gisma.ai.entity.auth.User;
import iaf.ofek.gisma.ai.service.auth.AuthService;
import iaf.ofek.gisma.ai.service.auth.CookieUtil;
import iaf.ofek.gisma.ai.service.auth.Token;
import iaf.ofek.gisma.ai.service.auth.UserService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.UUID;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Validated
public class AuthController {

    private final AuthService authService;

    private final CookieUtil cookieUtil;

    private final UserService userService;

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginUserDto loginUserDto, HttpServletResponse response) {
        UUID userId = authService.authenticate(loginUserDto);
        cookieUtil.addCookies(response, userId);

        return ResponseEntity.ok()
                .body("Login success");
    }

    @PostMapping("/signup")
    public ResponseEntity<User> registerUser(@RequestBody @Valid RegisterUserDto user) {
        if (true) {
            throw new RuntimeException("Currently unavailable feature");
        }

        User createdUser = userService.createUser(user);

        return new ResponseEntity<>(createdUser, HttpStatus.CREATED);
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(@CookieValue(name = Token.REFRESH_TOKEN) String refreshToken, HttpServletResponse response) {
        UUID userId = cookieUtil.extractUserId(refreshToken);
        cookieUtil.addCookies(response, userId);

        return ResponseEntity.ok()
                .body("Refresh token success");
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        cookieUtil.removeCookies(response);

        return ResponseEntity.ok()
                .body("Logout success");
    }

    @GetMapping("/me")
    public ResponseEntity<User> getUserInfo(@CookieValue(Token.ACCESS_TOKEN) String accessToken) {
        UUID userId = cookieUtil.extractUserId(accessToken);
        User user = userService.getUserById(userId);

        return ResponseEntity.ok(user);
    }


}
