package com.badal.notetaking.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthenticationFilter
        extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(
            JwtService jwtService) {

        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String authorizationHeader =
                request.getHeader("Authorization");

        /*
         * No Authorization header.
         *
         * Let Spring Security decide whether
         * the endpoint is public or protected.
         */
        if (authorizationHeader == null ||
                authorizationHeader.isBlank()) {

            filterChain.doFilter(request, response);
            return;
        }

        /*
         * Authorization header must be:
         *
         * Bearer <JWT>
         */
        if (!authorizationHeader.startsWith("Bearer ")) {

            filterChain.doFilter(request, response);
            return;
        }

        String token =
                authorizationHeader.substring(7).trim();

        if (token.isBlank()) {

            filterChain.doFilter(request, response);
            return;
        }

        try {

            /*
             * Validate JWT before creating
             * the Spring Security authentication.
             */
            if (jwtService.isTokenValid(token)) {

                String email =
                        jwtService.extractEmail(token);

                UsernamePasswordAuthenticationToken
                        authentication =
                        new UsernamePasswordAuthenticationToken(
                                email,
                                null,
                                Collections.emptyList()
                        );

                SecurityContextHolder
                        .getContext()
                        .setAuthentication(authentication);
            }

        } catch (Exception exception) {

            /*
             * Invalid JWT.
             */
            SecurityContextHolder
                    .clearContext();
        }

        filterChain.doFilter(request, response);
    }
}