package iaf.ofek.gisma.ai.agent.llmCall;

import iaf.ofek.gisma.ai.agent.memory.ChatMemoryAdvisorProvider;
import lombok.extern.log4j.Log4j2;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.client.advisor.api.Advisor;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Arrays;
import java.util.function.Function;

import static iaf.ofek.gisma.ai.constant.AdvisorOrder.CHAT_MEMORY_ADVISOR_ORDER;

@Service
@Log4j2
public class LLMCallerWithMemoryService {

    private final LLMCallerService llmCallerService;

    private final ChatMemoryAdvisorProvider memoryAdvisorProvider;

    @Autowired
    public LLMCallerWithMemoryService(ChatClient.Builder builder, ChatMemoryAdvisorProvider memoryAdvisorProvider) {
        this.llmCallerService = new LLMCallerService(
                builder, MessageChatMemoryAdvisor.builder(memoryAdvisorProvider.getChatMemory())
                        .order(CHAT_MEMORY_ADVISOR_ORDER)
                        .build()
        );
        this.memoryAdvisorProvider = memoryAdvisorProvider;
    }

    public LLMCallerWithMemoryService(ChatClient.Builder builder, ChatMemoryAdvisorProvider memoryAdvisorProvider, Advisor... extraAdvisors) {
        this.llmCallerService = new LLMCallerService(
                builder,
                combineAdvisors(extraAdvisors, MessageChatMemoryAdvisor.builder(memoryAdvisorProvider.getChatMemory())
                        .order(CHAT_MEMORY_ADVISOR_ORDER)
                        .build())
        );
        this.memoryAdvisorProvider = memoryAdvisorProvider;
    }

    public LLMCallerWithMemoryService(ChatClient.Builder builder, ToolCallbackProvider toolCallbackProvider, ChatMemoryAdvisorProvider memoryAdvisorProvider) {
        this.llmCallerService = new LLMCallerService(
                builder,
             toolCallbackProvider,
             MessageChatMemoryAdvisor.builder(memoryAdvisorProvider.getChatMemory())
                        .order(CHAT_MEMORY_ADVISOR_ORDER)
                        .build()
        );
        this.memoryAdvisorProvider = memoryAdvisorProvider;
    }

    public Flux<String> callLLM(Function<ChatClient, ChatClient.ChatClientRequestSpec> callback, String chatId) {
        return llmCallerService.callLLM(callback, chatId, memoryAdvisorProvider::shortTermMemoryAdvisorConsumer);
    }

    public String callLLMBlocking(Function<ChatClient, ChatClient.ChatClientRequestSpec> callback, String chatId) {
        return llmCallerService.callLLMBlocking(callback, chatId, memoryAdvisorProvider::shortTermMemoryAdvisorConsumer);
    }

    protected static Advisor[] combineAdvisors(Advisor[] extra, Advisor additional) {
        Advisor[] combined = Arrays.copyOf(extra, extra.length + 1);
        combined[extra.length] = additional;
        return combined;
    }

}
