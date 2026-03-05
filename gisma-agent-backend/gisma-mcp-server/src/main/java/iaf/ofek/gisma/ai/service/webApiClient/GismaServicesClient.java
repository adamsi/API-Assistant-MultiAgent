package iaf.ofek.gisma.ai.service.webApiClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.JsonSerializable;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;


import java.util.List;

@Service
public class GismaServicesClient {

    private final WebClient webClient = WebClient.create("https://www.fruityvice.com/api/fruit");

    public List<JsonNode> getAllFruits() {
        return webClient.get()
                .uri("/all")
                .retrieve()
                .bodyToFlux(JsonNode.class)
                .collectList()
                .onErrorReturn(List.of())
                .block();
    }

    public JsonNode getFruitByName(String name) {
        return webClient.get()
                .uri("/{name}", name)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .onErrorReturn(JsonNodeFactory.instance.objectNode())
                .block();
    }

}
