package iaf.ofek.gisma.ai.service.tools;

import com.fasterxml.jackson.databind.JsonNode;
import iaf.ofek.gisma.ai.service.webApiClient.GismaServicesClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Log4j2
public class GismaServicesTools {

    private final GismaServicesClient gismaServicesClient;

    @Tool(description = "Get all fruits")
    public List<JsonNode> getAllFruits() {
        return gismaServicesClient.getAllFruits();
    }

    @Tool(description = "Get fruit by name")
    public JsonNode getFruitByName(String name) {
        log.info("getFruitByName started. name: {}.", name);
        return gismaServicesClient.getFruitByName(name);
    }

}
