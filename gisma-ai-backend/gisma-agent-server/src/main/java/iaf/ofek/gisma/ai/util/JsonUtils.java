package iaf.ofek.gisma.ai.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import iaf.ofek.gisma.ai.exception.SchemaValidationException;
import org.springframework.stereotype.Service;

@Service
public class JsonUtils {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    public static <T> T parseJson(String rawJson, Class<T> targetClass) {
        try {
            return objectMapper.readValue(rawJson, targetClass);
        } catch (Exception e) {
            throw new SchemaValidationException("JSON validation failed against class " + targetClass.getSimpleName(), e);
        }
    }

}
