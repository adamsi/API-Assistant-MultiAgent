package iaf.ofek.gisma.ai.repository;

import iaf.ofek.gisma.ai.dto.agent.memory.ChatMessage;
import iaf.ofek.gisma.ai.dto.agent.memory.ChatMetadata;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatMemoryRepository {

    private final JdbcTemplate jdbcTemplate;

    @Transactional
    public String generateChatId(UUID userId, String description) {
        String sql = "INSERT INTO chat_memory (user_id, description) VALUES (?, ?) RETURNING conversation_id";
        return jdbcTemplate.queryForObject(sql, String.class, userId, description);
    }

    @Transactional
    public void delete(UUID chatId) {
        jdbcTemplate.update(
                "DELETE FROM spring_ai_chat_memory WHERE conversation_id = ?",
                chatId.toString()
        );
        jdbcTemplate.update(
                "DELETE FROM chat_memory WHERE conversation_id = ?",
                chatId
        );
    }

    public boolean chatIdExists(UUID chatId) {
        String sql = "SELECT COUNT(*) FROM chat_memory WHERE conversation_id = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, chatId);
        return count != null && count == 1;
    }

    public List<ChatMetadata> getAllChatsForUser(UUID userId) {
        String sql = "SELECT conversation_id, description FROM chat_memory WHERE user_id = ? ORDER BY sequence_number DESC";
        return jdbcTemplate.query(sql, (rs, rowNum) ->
                new ChatMetadata(rs.getString("conversation_id"), rs.getString("description")), userId);
    }

    public List<ChatMessage> getChatMessages(String chatId) {
        String sql = "SELECT content, type FROM spring_ai_chat_memory WHERE conversation_id = ? ORDER BY timestamp ASC";
        return jdbcTemplate.query(sql, (rs, rowNum) ->
                new ChatMessage(rs.getString("content"), rs.getString("type")), chatId);
    }

}
