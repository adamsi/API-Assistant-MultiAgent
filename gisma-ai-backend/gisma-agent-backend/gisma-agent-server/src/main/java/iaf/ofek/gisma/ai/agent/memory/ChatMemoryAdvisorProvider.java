package iaf.ofek.gisma.ai.agent.memory;

import lombok.Getter;
import org.apache.commons.lang3.StringUtils;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.chat.memory.repository.jdbc.JdbcChatMemoryRepository;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.function.Consumer;

@Service
public class ChatMemoryAdvisorProvider {

    private static final String DEFAULT_CHAT_ID = "default";

    @Getter
    private final ChatMemory chatMemory;

    public ChatMemoryAdvisorProvider(JdbcChatMemoryRepository jdbcChatMemoryRepository) {
        MessageWindowChatMemory messageWindowChatMemory = MessageWindowChatMemory.builder()
                .chatMemoryRepository(jdbcChatMemoryRepository)
                .maxMessages(10)
                .build();
        this.chatMemory = new CleanChatMemory(messageWindowChatMemory);
    }

    public Consumer<ChatClient.AdvisorSpec> shortTermMemoryAdvisorConsumer(String chatId) {
        String finalChatId = StringUtils.defaultIfBlank(chatId, DEFAULT_CHAT_ID);

        return a -> a.param(ChatMemory.CONVERSATION_ID, finalChatId);
    }

}
