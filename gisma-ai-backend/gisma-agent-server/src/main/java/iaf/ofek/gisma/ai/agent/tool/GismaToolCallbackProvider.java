package iaf.ofek.gisma.ai.agent.tool;

import org.springframework.ai.tool.ToolCallback;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.lang.NonNull;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

public final class GismaToolCallbackProvider implements ToolCallbackProvider {
    private final ToolCallbackProvider delegate;
    private final Set<String> allowedNames;

    public GismaToolCallbackProvider(ToolCallbackProvider delegate, String... allowedToolNames) {
        this.delegate = delegate;
        this.allowedNames = Arrays.stream(allowedToolNames).collect(Collectors.toSet());
    }

    @Override
    @NonNull
    public ToolCallback[] getToolCallbacks() {
        return Arrays.stream(delegate.getToolCallbacks())
                .filter(tc -> allowedNames.contains(tc.getToolDefinition().name()))
                .toArray(ToolCallback[]::new);
    }
}
