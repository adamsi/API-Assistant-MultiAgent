package iaf.ofek.gisma.ai.agent.memory;

import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.MessageType;
import org.springframework.ai.chat.messages.UserMessage;

import java.util.List;
import java.util.stream.Collectors;

public class CleanChatMemory implements ChatMemory {

    private final MessageWindowChatMemory delegate;

    public CleanChatMemory(MessageWindowChatMemory delegate) {
        this.delegate = delegate;
    }

    @Override
    public void add(String conversationId, List<Message> messages) {
        List<Message> cleaned = messages.stream()
                .map(msg -> {
                    if (msg.getMessageType() == MessageType.USER) {
                        return new UserMessage(stripAdvisorFormatting(msg.getText()));
                    }
                    return msg;
                })
                .collect(Collectors.toList());

        delegate.add(conversationId, cleaned);
    }

    @Override
    public List<Message> get(String conversationId) {
        return delegate.get(conversationId);
    }

    @Override
    public void clear(String conversationId) {
        delegate.clear(conversationId);
    }

    private String stripAdvisorFormatting(String content) {
        String marker = "### USER QUERY:";
        int index = content.indexOf(marker);
        if (index >= 0) {
            String afterMarker = content.substring(index + marker.length()).trim();
            int nextMarker = afterMarker.indexOf("### RESPONSE FORMAT");
            if (nextMarker >= 0) {
                return afterMarker.substring(0, nextMarker).trim();
            }
            return afterMarker;
        }
        return content;
    }

}

