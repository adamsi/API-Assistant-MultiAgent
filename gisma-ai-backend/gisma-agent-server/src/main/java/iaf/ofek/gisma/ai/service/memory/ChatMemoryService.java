package iaf.ofek.gisma.ai.service.memory;

import iaf.ofek.gisma.ai.agent.memory.ChatDescriptionGenerator;
import iaf.ofek.gisma.ai.dto.agent.memory.ChatMessage;
import iaf.ofek.gisma.ai.dto.agent.memory.ChatMetadata;
import iaf.ofek.gisma.ai.dto.agent.memory.ChatStartRequest;
import iaf.ofek.gisma.ai.dto.agent.memory.ChatStartResponse;
import iaf.ofek.gisma.ai.repository.ChatMemoryRepository;
import iaf.ofek.gisma.ai.util.StringUtils;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.UUID;

import static iaf.ofek.gisma.ai.util.ReactiveUtils.runBlockingCallableAsync;

@Service
@RequiredArgsConstructor
public class ChatMemoryService {

    private final ChatMemoryRepository chatMemoryRepository;

    private final ChatDescriptionGenerator chatDescriptionGenerator;

    /**
     * Retrieves all chat conversations for display in the sidebar
     **/
    public List<ChatMetadata> getAllChats(UUID userId) {
        return this.chatMemoryRepository.getAllChatsForUser(userId);
    }

    /**
     * Loads the complete message history for a specific chat
     **/
    public List<ChatMessage> getChatMessages(String chatId) {
        return chatMemoryRepository.getChatMessages(chatId);
    }

    public void deleteChat(String chatId) {
        UUID uuidChatId = UUID.fromString(chatId);

        if (!chatMemoryRepository.chatIdExists(uuidChatId)) {
            throw new EntityNotFoundException("Chat with id: `%s` was not found".formatted(chatId));
        }

        chatMemoryRepository.delete(uuidChatId);
    }

    public Mono<ChatStartResponse> createChat(ChatStartRequest chatStartRequest, UUID userId) {
        return chatDescriptionGenerator.generateDescription(chatStartRequest.query())
                .flatMap(description ->
                        runBlockingCallableAsync(() -> {
                            String finalDescription = StringUtils.stripWrappers(description);
                            String chatId = chatMemoryRepository.generateChatId(userId, finalDescription);

                            return new ChatStartResponse(chatId, finalDescription);
                        })
                );
    }

}
