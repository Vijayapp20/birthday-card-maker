# ── Build stage ──────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copy pom.xml first and download dependencies (better layer caching)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and build the jar
COPY src ./src
RUN mvn clean package -DskipTests -B

# ── Run stage ────────────────────────────────────────────────
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy the built jar from the build stage
COPY --from=build /app/target/*.jar app.jar

# Render sets $PORT at runtime; the app reads it via server.port=${PORT:8080}
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
