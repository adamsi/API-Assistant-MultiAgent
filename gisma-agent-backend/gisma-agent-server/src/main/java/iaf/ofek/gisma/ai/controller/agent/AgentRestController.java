package iaf.ofek.gisma.ai.controller.agent;

import iaf.ofek.gisma.ai.agent.SupervisorExecutor;
import iaf.ofek.gisma.ai.dto.agent.PromptRequest;
import iaf.ofek.gisma.ai.dto.agent.PromptResponse;
import iaf.ofek.gisma.ai.dto.agent.UserPrompt;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/prompt")
@Log4j2
@RequiredArgsConstructor
public class AgentRestController {
    @Value("${gisma.subagents_server.url}")
    private String subagentsServerUrl;

    private final WebClient webClient = WebClient.create(subagentsServerUrl);

    private final SupervisorExecutor supervisorExecutor;


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