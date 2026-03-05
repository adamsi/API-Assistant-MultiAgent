package iaf.ofek.gisma.ai.controller.agent;

import iaf.ofek.gisma.ai.dto.agent.memory.ChatMessage;
import iaf.ofek.gisma.ai.dto.agent.memory.ChatMetadata;
import iaf.ofek.gisma.ai.service.memory.ChatMemoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/chat-memory")
@RequiredArgsConstructor
public class ChatMemoryController {

    private final ChatMemoryService chatMemoryService;

    @GetMapping
    public List<ChatMetadata> getAllChats(Authentication authentication) {
        UUID userId = (UUID) authentication.getPrincipal();

        return chatMemoryService.getAllChats(userId);
    }

    @GetMapping("/{chatId}")
    public List<ChatMessage> getChatMessages(@PathVariable("chatId") String chatId) {
        return chatMemoryService.getChatMessages(chatId);
    }

    @DeleteMapping("/{chatId}")
    public ResponseEntity<?> deleteChat(@PathVariable("chatId") String chatId) {
        chatMemoryService.deleteChat(chatId);

        return ResponseEntity.noContent().build();
    }

}
