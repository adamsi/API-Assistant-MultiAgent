package iaf.ofek.gisma.ai.tools;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Service
@Log4j2
public class SubagentsTools {

    private final WebClient webClient;

    public SubagentsTools(@Value("${gisma.subagents_server.url}") String subagentsServerUrl) {
        this.webClient = WebClient.create(subagentsServerUrl);
    }

    @Tool(description = "Get gisma data by user prompt")
    public String getGismaData(String prompt) {
        return webClient.post()
                .uri("/data")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("prompt", prompt))
                .retrieve()
                .bodyToMono(String.class)
                .doOnError(Throwable::printStackTrace)
                .onErrorReturn("Could not fetch data due to unexpected error")
                .block();
    }
}
