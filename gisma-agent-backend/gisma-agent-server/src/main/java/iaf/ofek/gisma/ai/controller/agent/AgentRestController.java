package iaf.ofek.gisma.ai.controller.agent;

import iaf.ofek.gisma.ai.agent.SupervisorExecutor;
import iaf.ofek.gisma.ai.dto.agent.PromptResponse;
import iaf.ofek.gisma.ai.dto.agent.UserPrompt;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/prompt")
@Log4j2
@RequiredArgsConstructor
public class AgentRestController {
    private final SupervisorExecutor supervisorExecutor;

    @PostMapping
    public PromptResponse handlePrompt(@RequestBody UserPrompt prompt) {
        log.info("handlePrompt started. prompt: {}", prompt);
        // Here we will route based on output_mode=api
        var response = new PromptResponse(supervisorExecutor.handleQueryBlocking(prompt));
        log.info("handlePrompt ended. response: {}", response);

        return response;
    }
}