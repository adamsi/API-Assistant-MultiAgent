package iaf.ofek.gisma.ai.filter;

import iaf.ofek.gisma.ai.entity.auth.User;
import iaf.ofek.gisma.ai.service.auth.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserService userService;

    @Override
    public UserDetails loadUserByUsername(String name) {
        final String GRANTED_AUTH_PREFIX = "ROLE_";
        User user = userService.findUserByUsernameOrEmail(name)
                .orElseThrow(() -> new UsernameNotFoundException(String.format("user `%s` not found", name)));

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword() == null ? "" : user.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority(GRANTED_AUTH_PREFIX + user.getRole()))
        );
    }

    public UserDetails loadUserById(UUID id) {
        final String GRANTED_AUTH_PREFIX = "ROLE_";
        User user = userService.getUserById(id);

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword() == null ? "" : user.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority(GRANTED_AUTH_PREFIX + user.getRole()))
        );
    }

}
