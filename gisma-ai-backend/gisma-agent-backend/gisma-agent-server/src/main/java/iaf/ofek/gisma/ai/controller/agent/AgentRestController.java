package iaf.ofek.gisma.ai.controller.agent;

import iaf.ofek.gisma.ai.agent.SupervisorExecutor;
import iaf.ofek.gisma.ai.dto.agent.PromptResponse;
import iaf.ofek.gisma.ai.dto.agent.ServiceApi;
import iaf.ofek.gisma.ai.dto.agent.UserApiPrompt;
import iaf.ofek.gisma.ai.dto.agent.UserPrompt;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.List;

@RestController
@RequestMapping("/prompt")
@Log4j2
public class AgentRestController {
    private final WebClient webClient;
    private final SupervisorExecutor supervisorExecutor;

    public AgentRestController(SupervisorExecutor supervisorExecutor, @Value("${gisma.subagents_server.url}") String subagentsServerUrl) {
        this.supervisorExecutor = supervisorExecutor;
        this.webClient = WebClient.create(subagentsServerUrl);
    }

    @PostMapping("/data")
    public PromptResponse handleDataPrompt(@RequestBody UserPrompt prompt) {
        log.info("handlePrompt started. prompt: {}", prompt);
        var response = new PromptResponse(supervisorExecutor.handleQueryBlocking(prompt));
        log.info("handlePrompt ended. response: {}", response);

        return response;
    }

    @PostMapping("/api")
    public PromptResponse handleApiPrompt(@RequestBody UserApiPrompt request) {
        log.info("handleApiPrompt started. prompt: {}", request);
        String apiResponse = webClient.post()
                .uri("/api")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(String.class)
                .retryWhen(Retry.fixedDelay(2, Duration.ofMillis(200)))
                .onErrorReturn("Could not fetch data due to unexcepted error")
                .block();

        var response = new PromptResponse(apiResponse);
        log.info("handleApiPrompt ended. response: {}", response);

        return response;
    }

    @GetMapping("/api/catalog")
    public List<ServiceApi> handleApiCatalog() {
        log.info("handleApiCatalog started.");
        List<ServiceApi> response = webClient.get()
                .uri("/api/catalog")
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<ServiceApi>>() {
                })
                .retryWhen(Retry.fixedDelay(2, Duration.ofMillis(200)))
                .onErrorReturn(List.of())
                .block();

        log.info("handleApiCatalog ended. response: {}", response);
        return response;
    }
}
