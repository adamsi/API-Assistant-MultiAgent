package iaf.ofek.gisma.ai.agent.memory;

import iaf.ofek.gisma.ai.agent.llmCall.LLMCallerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class ChatDescriptionGenerator {

    private final LLMCallerService llmCallerService;

    private static final String SYSTEM_INSTRUCTIONS = """
            Generate a chat description based on the message, 
            limiting the description to 20 characters
            """;

    public Mono<String> generateDescription(String message) {
        return llmCallerService.callLLM(chatClient -> chatClient.prompt()
                .system(SYSTEM_INSTRUCTIONS)
                .user(message));
    }

}
