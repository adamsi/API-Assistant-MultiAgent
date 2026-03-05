package iaf.ofek.gisma.ai.agent.llmCall;

import iaf.ofek.gisma.ai.exception.SchemaValidationException;
import iaf.ofek.gisma.ai.util.ReactiveUtils;
import iaf.ofek.gisma.ai.util.RetryUtils;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.SimpleLoggerAdvisor;
import org.springframework.ai.chat.client.advisor.api.Advisor;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.function.Consumer;
import java.util.function.Function;

import static iaf.ofek.gisma.ai.constant.AdvisorOrder.LOGGER_ADVISOR_ORDER;
import static iaf.ofek.gisma.ai.util.JsonUtils.parseJson;
import static iaf.ofek.gisma.ai.util.RetryUtils.callWithRetries;

@Service
public class LLMCallerService {

    private static final int MAX_LLM_RETRY_CALLS = 3;

    private static final int LLM_RETRY_DELAY_SECONDS = 2;

    private final ChatClient chatClient;

    @Autowired
    public LLMCallerService(ChatClient.Builder builder) {
        SimpleLoggerAdvisor loggerAdvisor = SimpleLoggerAdvisor.builder().order(100).build();
        this.chatClient = builder
                .defaultAdvisors(loggerAdvisor)
                .build();
    }

    public LLMCallerService(ChatClient.Builder builder, Advisor... extraAdvisors) {
        SimpleLoggerAdvisor loggerAdvisor = SimpleLoggerAdvisor.builder().order(LOGGER_ADVISOR_ORDER).build();
        List<Advisor> advisors = new ArrayList<>(Arrays.stream(extraAdvisors).toList());
        advisors.add(loggerAdvisor);
        this.chatClient = builder
                .defaultAdvisors(advisors)
                .build();
    }

    public LLMCallerService(ChatClient.Builder builder, ToolCallbackProvider toolCallbackProvider, Advisor... extraAdvisors) {
        SimpleLoggerAdvisor loggerAdvisor = SimpleLoggerAdvisor.builder().order(LOGGER_ADVISOR_ORDER).build();
        List<Advisor> advisors = new ArrayList<>(Arrays.stream(extraAdvisors).toList());
        advisors.add(loggerAdvisor);
        this.chatClient = builder
                .defaultAdvisors(advisors)
                .defaultToolCallbacks(toolCallbackProvider)
                .build();
    }

    public <T> T callLLMWithSchemaValidation(Function<ChatClient, ChatClient.ChatClientRequestSpec> callback, Class<T> responseType, String chatId, Function<String, Consumer<ChatClient.AdvisorSpec>> consumer) {
        return callWithRetries(
                () -> {
                    String rawResponse = callback.apply(chatClient)
                            .advisors(consumer.apply(chatId))
                            .call()
                            .content();

                    return parseJson(rawResponse, responseType);
                },
                MAX_LLM_RETRY_CALLS,
                Duration.ofSeconds(LLM_RETRY_DELAY_SECONDS),
                ex -> !(ex instanceof SchemaValidationException),
                "callLLMWithSchemaValidation"
        );
    }

    // response to user call
    public Flux<String> callLLM(Function<ChatClient, ChatClient.ChatClientRequestSpec> callback, String chatId, Function<String, Consumer<ChatClient.AdvisorSpec>> consumer) {
        return callback.apply(chatClient)
                .advisors(consumer.apply(chatId))
                .stream()
                .content();
    }

    public String callLLMBlocking(Function<ChatClient, ChatClient.ChatClientRequestSpec> callback, String chatId, Function<String, Consumer<ChatClient.AdvisorSpec>> consumer) {
        return callback.apply(chatClient)
                .advisors(consumer.apply(chatId))
                .call()
                .content();
    }

    public Mono<String> callLLM(Function<ChatClient, ChatClient.ChatClientRequestSpec> callback) {
        return ReactiveUtils.runBlockingCallableAsync(() ->
                callback.apply(chatClient)
                        .call()
                        .content());
    }

}
