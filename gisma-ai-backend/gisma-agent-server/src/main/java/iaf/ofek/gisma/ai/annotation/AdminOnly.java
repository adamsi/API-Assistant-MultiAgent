package iaf.ofek.gisma.ai.annotation;

import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.annotation.*;

@Target(ElementType.TYPE)   // can be used on class level
@Retention(RetentionPolicy.RUNTIME)
@Inherited
@PreAuthorize("hasRole('ADMIN')")
public @interface AdminOnly {
}
