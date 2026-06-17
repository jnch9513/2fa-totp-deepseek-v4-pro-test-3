FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -B

FROM eclipse-temurin:21-jre-alpine
RUN apk add --no-cache curl
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8081
HEALTHCHECK --interval=10s --timeout=5s --retries=10 --start-period=20s \
  CMD curl -sf http://localhost:8081/actuator/health | grep -q UP
ENTRYPOINT ["java", "-jar", "app.jar"]
