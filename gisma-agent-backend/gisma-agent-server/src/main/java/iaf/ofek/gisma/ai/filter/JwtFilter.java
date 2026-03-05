package iaf.ofek.gisma.ai.filter;

import iaf.ofek.gisma.ai.exception.TokenProcessingException;
import iaf.ofek.gisma.ai.service.auth.Token;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

@Log4j2
@Component
@AllArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain) throws ServletException, IOException {
        String servletPath = request.getServletPath();

        if (servletPath.startsWith("/auth/me") || !servletPath.startsWith("/test")
                || (!servletPath.startsWith("/auth/"))) {
            try {
                Optional<String> tokenOptional = getJwtFromCookies(request);
                tokenOptional.filter(token -> !token.isBlank())
                        .filter(jwtUtil::validateToken)
                        .ifPresent(jwtToken -> {
                            UUID userId = jwtUtil.extractUserId(jwtToken);

                            if (userId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                                UsernamePasswordAuthenticationToken auth =
                                        new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());
                                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                                SecurityContextHolder.getContext().setAuthentication(auth);
                            }
                        });

            } catch (Exception e) {
                log.warn(e.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }


    private Optional<String> getJwtFromCookies(HttpServletRequest request) {
        if (request.getCookies() == null || request.getCookies().length == 0) {
            throw new TokenProcessingException("no tokens were given");
        }

        return Arrays.stream(request.getCookies())
                .filter(cookie -> Token.ACCESS_TOKEN.equals(cookie.getName()))
                .map(Cookie::getValue)
                .findFirst();
    }

}
