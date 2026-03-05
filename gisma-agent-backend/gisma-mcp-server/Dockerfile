FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY . .

RUN mvn clean package -DskipTests -B

FROM eclipse-temurin:17-jdk-jammy AS runtime
WORKDIR /app

COPY --from=build /app/gisma-mcp-server/target/gisma-mcp-server-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]