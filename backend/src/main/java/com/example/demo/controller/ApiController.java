package com.example.demo.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
public class ApiController {

    @GetMapping("/api/public/hello")
    public Mono<Map<String, String>> publicHello() {
        return Mono.just(Map.of(
                "message", "Hello from public endpoint!",
                "status", "ok"
        ));
    }

    @GetMapping("/api/secure/userinfo")
    public Mono<Map<String, Object>> userInfo(@AuthenticationPrincipal Jwt jwt) {
        return Mono.just(Map.of(
                "subject", jwt.getSubject(),
                "claims", jwt.getClaims(),
                "message", "Authenticated successfully with 6-digit TOTP as second factor"
        ));
    }

    @GetMapping("/api/secure/hello")
    public Mono<Map<String, String>> secureHello(@AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaimAsString("preferred_username");
        return Mono.just(Map.of(
                "message", "Hello, " + username + "! You are authenticated.",
                "auth", "JWT validated — TOTP 6-digit second factor is enforced by Keycloak"
        ));
    }
}
