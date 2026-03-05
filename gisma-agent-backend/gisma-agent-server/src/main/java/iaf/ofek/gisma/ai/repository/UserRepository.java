package iaf.ofek.gisma.ai.repository;

import iaf.ofek.gisma.ai.entity.auth.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmailOrUsername(String email, String username);

    Optional<User> findByEmail(String email);

    @NonNull
    Optional<User> findById(@NonNull UUID id);

}
