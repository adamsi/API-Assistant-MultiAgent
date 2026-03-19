package iaf.ofek.gisma.ai.agent;

import iaf.ofek.gisma.ai.agent.llmCall.LLMCallerWithMemoryService;
import iaf.ofek.gisma.ai.agent.memory.ChatMemoryAdvisorProvider;
import iaf.ofek.gisma.ai.agent.prompt.PromptFormat;
import iaf.ofek.gisma.ai.agent.rag.RagService;
import iaf.ofek.gisma.ai.dto.agent.UserPrompt;
import lombok.extern.log4j.Log4j2;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.UUID;

@Service
@Log4j2
public class SupervisorExecutor {
    private static final String SYSTEM_MESSAGE_TEMPLATE = """
            You are the Gisma API Assistant.
            Answer user queries using documentation (RAG CONTEXT), chat memory, and live data via mcp tools.
            if the answer requires data fetching or is not in RAG CONTEXT, you must use mcp tools.
            preserve the exact user intent. Do NOT modify or reinterpret.
            Do not use outside knowledge, Do not answer non related questions.
            
            Response format should be Friendly, well-structured style:
            - Use clear formatting and naturally include emojis to enhance readability.
            - When returning fetched or structured data, always present it in a well-formatted table.
            - NEVER return fetched data not in table format.
            
            ###RAG CONTEXT###
            {rag_context}
            """;
    private final LLMCallerWithMemoryService llmCallerService;
    private final RagService ragService;

    public SupervisorExecutor(ChatClient.Builder builder, ToolCallbackProvider tools,
                              ChatMemoryAdvisorProvider memoryAdvisorProvider, RagService ragService) {
        this.llmCallerService = new LLMCallerWithMemoryService(builder, tools, memoryAdvisorProvider);
        this.ragService = ragService;
    }

    private Flux<String> execute(UserPrompt userPrompt, String chatId) {
        String query = userPrompt.prompt();
        String systemMessage = SYSTEM_MESSAGE_TEMPLATE.replace(PromptFormat.RAG_CONTEXT, ragService.getContext(query));
        return llmCallerService.callLLM(chatClient -> chatClient.prompt()
                .system(systemMessage)
                .user(query), chatId)
                .onErrorResume(ex -> {
                    log.error("LLM pipeline failed", ex);
                    return Flux.just("Something went wrong. try again...");
                });
    }

    private String executeBlocking(UserPrompt userPrompt, String chatId) {
        String query = userPrompt.prompt();
        String systemMessage = SYSTEM_MESSAGE_TEMPLATE.replace(PromptFormat.RAG_CONTEXT, ragService.getContext(query));
        return llmCallerService.callLLMBlocking(chatClient -> chatClient.prompt()
                .system(systemMessage)
                .user(query), chatId);
    }

    public Flux<String> handleQuery(UserPrompt prompt, String chatId) {
        return execute(prompt, chatId);
    }

    public String handleQueryBlocking(UserPrompt prompt) {
        return executeBlocking(prompt, UUID.randomUUID().toString());
    }
}
