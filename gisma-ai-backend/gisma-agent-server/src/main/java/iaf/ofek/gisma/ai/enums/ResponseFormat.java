package iaf.ofek.gisma.ai.enums;

import iaf.ofek.gisma.ai.agent.prompt.PromptFormat;
import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public enum ResponseFormat {

    SIMPLE {
        @Override
        public String getFormat(String schema) {
            return """
            
            """;
        }
    },

    JSON {
        @Override
        public String getFormat(String schema) {
            return  """
                    Only return valid JSON, pretty printed inside json code block
                    """;
        }
    },

    SCHEMA {
        @Override
        public String getFormat(String schema) {
            return  """
                    Response should match the next JSON Schema (pretty printed inside json code block): {schema_json} 
                    """
                    .replace(PromptFormat.SCHEMA_JSON, schema);
        }
    };

    public abstract String getFormat(String schema);

}
