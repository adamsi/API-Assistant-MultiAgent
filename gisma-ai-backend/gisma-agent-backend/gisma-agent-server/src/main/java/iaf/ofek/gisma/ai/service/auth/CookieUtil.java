package iaf.ofek.gisma.ai.service.auth;

import iaf.ofek.gisma.ai.filter.JwtUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

@Component
public class CookieUtil {

    private final JwtUtil jwtUtil;

    private final Map<String, Integer> cookies;

    private final String allowedDomain;

    public CookieUtil(JwtUtil jwtUtil,
                      @Value("${sa.allowed.domain}") String allowedDomain,
                      @Value("${sa.jwt.access-expiration-ms}") Integer accessTokenExpirationMs,
                      @Value("${sa.jwt.refresh-expiration-ms}") Integer refreshTokenExpirationMs) {
        this.jwtUtil = jwtUtil;
        cookies = Map.of(
                Token.ACCESS_TOKEN, accessTokenExpirationMs,
                Token.REFRESH_TOKEN, refreshTokenExpirationMs);
        this.allowedDomain = allowedDomain;
    }

    public void addCookies(final HttpServletResponse httpServletResponse, UUID userId) {
        operateCookies(httpServletResponse, this::setAuthCookie, userId);
    }

    public void removeCookies(final HttpServletResponse httpServletResponse) {
        operateCookies(httpServletResponse, this::clearAuthCookie, null);
    }

    private void operateCookies(final HttpServletResponse response, CookieGenerator generator, UUID userId) {
        cookies.forEach((cookie, expirationMs) -> generator.generate(response, userId, cookie, expirationMs));
    }

    private void setAuthCookie(final HttpServletResponse response, final UUID userId, final String cookieName, final Integer expirationMs) {
        String jwt = jwtUtil.generateToken(userId, expirationMs);
        ResponseCookie cookie = ResponseCookie.from(cookieName, jwt)
                .httpOnly(true)
                .path("/")
                .domain(allowedDomain)
                .secure(true)
                .sameSite("None")
                .build();
        response.addHeader("Set-Cookie", cookie.toString());
    }

    private void clearAuthCookie(HttpServletResponse response, final UUID userId, final String cookieName, final Integer expirationMs) {
        ResponseCookie cookie = ResponseCookie.from(cookieName, "")
                .httpOnly(true)
                .path("/")
                .domain(allowedDomain)
                .secure(true)
                .sameSite("None")
                .maxAge(0)
                .build();
        response.addHeader("Set-Cookie", cookie.toString());
    }

    public UUID extractUserId(String refreshToken) {
        return jwtUtil.extractUserId(refreshToken);
    }

    @FunctionalInterface
    interface CookieGenerator {
        void generate(final HttpServletResponse response, final UUID userId, final String cookieName, final Integer expirationMs);
    }

}
