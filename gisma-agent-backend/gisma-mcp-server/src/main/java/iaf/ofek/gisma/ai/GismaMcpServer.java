package iaf.ofek.gisma.ai;

import iaf.ofek.gisma.ai.service.tools.GismaServicesTools;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.ai.tool.method.MethodToolCallbackProvider;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class GismaMcpServer {

    public static void main(String[] args) {
        SpringApplication.run(GismaMcpServer.class, args);
    }

    @Bean
    public ToolCallbackProvider tools(GismaServicesTools gismaServicesTools) {
        return MethodToolCallbackProvider.builder()
                .toolObjects(gismaServicesTools)
                .build();
    }

}
