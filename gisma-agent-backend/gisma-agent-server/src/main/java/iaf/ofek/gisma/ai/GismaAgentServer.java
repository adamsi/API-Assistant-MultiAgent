package iaf.ofek.gisma.ai;

import org.springframework.ai.vectorstore.pgvector.autoconfigure.PgVectorStoreAutoConfiguration;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync
@SpringBootApplication(exclude = PgVectorStoreAutoConfiguration.class)
public class GismaAgentServer {

    public static void main(String[] args) {
        SpringApplication.run(GismaAgentServer.class, args);
    }

}
