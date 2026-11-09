package com.resume.shortlister.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Resume Shortlister API")
                        .version("1.0.0")
                        .description("""
                                Production-ready API for candidate shortlisting.

                                ## Authentication
                                All protected endpoints require a JWT token in the Authorization header:
                                `Authorization: Bearer <token>`

                                ## Rate Limiting
                                - Auth endpoints: 5 requests/minute
                                - Public candidate submission: 30 requests/minute
                                - API endpoints: 100 requests/minute

                                Rate limit headers:
                                - `X-RateLimit-Limit`: Maximum requests allowed
                                - `X-RateLimit-Remaining`: Remaining requests in current window
                                - `Retry-After`: Seconds until next request allowed (on 429)

                                ## Error Responses
                                All errors follow a consistent format:
                                ```json
                                {
                                  "timestamp": "2024-01-15T10:30:00Z",
                                  "status": 400,
                                  "error": "Validation Failed",
                                  "message": "Invalid request parameters",
                                  "requestId": "a1b2c3d4",
                                  "details": {"field": "error message"}
                                }
                                ```

                                ## Pagination
                                List endpoints support pagination:
                                - `page`: Page number (0-based)
                                - `size`: Page size (default 20, max 100)
                                - `sortBy`: Field to sort by
                                - `sortDir`: `asc` or `desc`

                                Response includes:
                                - `content`: Array of items
                                - `totalElements`: Total count
                                - `totalPages`: Total pages
                                - `first`/`last`: Boolean flags
                                """)
                        .license(new License().name("MIT").url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server().url("http://localhost:8080/api").description("Local Development"),
                        new Server().url("https://api.resume-shortlister.example.com/api").description("Production")))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("JWT token obtained from /auth/login")));
    }
}