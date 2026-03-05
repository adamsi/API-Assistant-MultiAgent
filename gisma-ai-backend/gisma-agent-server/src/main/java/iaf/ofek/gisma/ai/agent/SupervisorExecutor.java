package iaf.ofek.gisma.ai.agent;

import iaf.ofek.gisma.ai.agent.llmCall.LLMCallerWithMemoryService;
import iaf.ofek.gisma.ai.agent.memory.ChatMemoryAdvisorProvider;
import iaf.ofek.gisma.ai.agent.prompt.PromptFormat;
import iaf.ofek.gisma.ai.dto.agent.UserPrompt;
import lombok.extern.log4j.Log4j2;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.vectorstore.QuestionAnswerAdvisor;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.UUID;

import static iaf.ofek.gisma.ai.constant.AdvisorOrder.QA_ADVISOR_ORDER;

@Service
@Log4j2
public class SupervisorExecutor {

    private static final String SYSTEM_MESSAGE = """
            You are the Gisma API Assistant.
            Answer user queries using documentation (RAG), chat memory, and live data via generate_sql tool.
          
            if the answer requires data fetching or is not in RAG CONTEXT
            call 'generate_sql` tool (retrieves data from the database).
            if you're not sure, call 'generate_sql' tool.
            
            Response format should be Friendly, well-structured style:
            - Use clear formatting and naturally include emojis to enhance readability.
            - When returning fetched or structured data, present it in a well-formatted table.
            """;


    private static final String USER_PROMPT_TEMPLATE = """
            ### USER QUERY:
            {query}
            """;


    private final LLMCallerWithMemoryService llmCallerService;

    private final QuestionAnswerAdvisor qaAdvisor;

    public SupervisorExecutor(@Qualifier("documentVectorStore") VectorStore documentVectorStore,
                              ChatClient.Builder builder, ToolCallbackProvider tools,
                              ChatMemoryAdvisorProvider memoryAdvisorProvider) {
        this.llmCallerService = new LLMCallerWithMemoryService(builder, tools, memoryAdvisorProvider);
        this.qaAdvisor = QuestionAnswerAdvisor.builder(documentVectorStore)
                .order(QA_ADVISOR_ORDER)
                .build();
    }

    private Flux<String> execute(UserPrompt userPrompt, String chatId) {
        String userMessage = USER_PROMPT_TEMPLATE
                .replace(PromptFormat.QUERY, userPrompt.query());

        return llmCallerService.callLLM(chatClient -> chatClient.prompt()
                .system(SYSTEM_MESSAGE)
                .user(userMessage)
                .advisors(qaAdvisor), chatId)
                .onErrorResume(ex -> {
                    log.error("LLM pipeline failed", ex);
                    return Flux.just("Something went wrong. try again...");
                });
    }

    private String executeBlocking(UserPrompt userPrompt, String chatId) {
        String userMessage = USER_PROMPT_TEMPLATE
                .replace(PromptFormat.QUERY, userPrompt.query());

        return llmCallerService.callLLMBlocking(chatClient -> chatClient.prompt()
                .system(SYSTEM_MESSAGE)
                .user(userMessage)
                .advisors(qaAdvisor), chatId);
    }

    public Flux<String> handleQuery(UserPrompt prompt, String chatId) {
        return execute(prompt, chatId);
    }

    public String handleQueryBlocking(UserPrompt prompt) {
        return executeBlocking(prompt, UUID.randomUUID().toString());
    }

}
