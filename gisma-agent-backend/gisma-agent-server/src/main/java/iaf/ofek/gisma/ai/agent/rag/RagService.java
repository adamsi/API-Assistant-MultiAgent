package iaf.ofek.gisma.ai.agent.rag;

import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class RagService {
    private final VectorStore vectorStore;

    public RagService(@Qualifier("documentVectorStore") VectorStore documentVectorStore) {
        this.vectorStore = documentVectorStore;
    }

    public String getContext(String prompt) {
        List<Document> docs = vectorStore.similaritySearch(prompt);

        return docs.stream()
                .map(Document::getText)
                .collect(Collectors.joining("\n\n"));
    }
}
