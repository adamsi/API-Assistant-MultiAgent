package iaf.ofek.gisma.ai.tools;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Log4j2
public class GismaServicesTools {

    @Value("${gisma.subagents_server.url}")
    private String subagentsServerUrl;

    private final WebClient webClient = WebClient.create(subagentsServerUrl);

    @Tool(description = "Get gisma data by user prompt")
    public String getGismaData(String prompt) {
        return webClient.post()
                .uri("/data")
                .bodyValue(Map.of("prompt", prompt))
                .retrieve()
                .bodyToMono(String.class)
                .onErrorReturn("Could not fetch data due to unexcepted error")
                .block();
    }

}
