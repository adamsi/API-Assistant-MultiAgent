package iaf.ofek.gisma.ai.controller.agent;

import iaf.ofek.gisma.ai.agent.SupervisorExecutor;
import iaf.ofek.gisma.ai.dto.agent.PromptRequest;
import iaf.ofek.gisma.ai.dto.agent.PromptResponse;
import iaf.ofek.gisma.ai.dto.agent.UserPrompt;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

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

    @PostMapping("/fruits")
    public PromptResponse handleFruitsPrompt(@RequestBody PromptRequest request) {
        log.info("handleFruitsPrompt started. prompt: {}", request);
        String apiResponse = webClient.post()
                .uri("/fruits")
                .bodyValue(Map.of("prompt", request.prompt()))
                .retrieve()
                .bodyToMono(String.class)
                .onErrorReturn("Could not fetch data due to unexcepted error")
                .block();

        var response = new PromptResponse(apiResponse);
        log.info("handleFruitsPrompt ended. response: {}", response);

        return response;
    }
}