package iaf.ofek.gisma.ai.agent.prompt;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class PromptFormat {

    public static final String SCHEMA_JSON = "{schema_json}";

    public static final String QUERY = "{query}";

    public static final String RESPONSE_FORMAT = "{response_format}";

}
