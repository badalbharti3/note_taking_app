package com.badal.notetaking.service;

import com.badal.notetaking.dto.AuthResponse;
import com.badal.notetaking.dto.LoginRequest;
import com.badal.notetaking.dto.SignupRequest;
import com.badal.notetaking.exception.UserAlreadyExistsException;
import com.badal.notetaking.model.User;
import com.badal.notetaking.repository.UserRepository;
import com.badal.notetaking.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AuthService {

private final UserRepository userRepository;
private final PasswordEncoder passwordEncoder;
private final JwtService jwtService;

public AuthService(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService) {

    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
}

public AuthResponse signup(SignupRequest request) {

    String email = request.getEmail()
            .trim()
            .toLowerCase();

    if (userRepository.existsByEmail(email)) {

        throw new UserAlreadyExistsException(
                "An account already exists with this email"
        );
    }

    LocalDateTime now = LocalDateTime.now();

    User user = User.builder()
            .name(request.getName().trim())
            .email(email)
            .password(
                    passwordEncoder.encode(
                            request.getPassword()
                    )
            )
            .createdAt(now)
            .updatedAt(now)
            .build();

    User savedUser =
            userRepository.save(user);

    String token =
            jwtService.generateToken(
                    savedUser
            );

    return AuthResponse.builder()
            .token(token)
            .userId(
                    savedUser.getId().toHexString()
            )
            .name(savedUser.getName())
            .email(savedUser.getEmail())
            .build();
}

public AuthResponse login(LoginRequest request) {

    String email = request.getEmail()
            .trim()
            .toLowerCase();

    User user =
            userRepository.findByEmail(email)
                    .orElseThrow(() ->
                            new IllegalArgumentException(
                                    "Invalid email or password"
                            )
                    );

    if (!passwordEncoder.matches(
            request.getPassword(),
            user.getPassword())) {

        throw new IllegalArgumentException(
                "Invalid email or password"
        );
    }

    String token =
            jwtService.generateToken(user);

    return AuthResponse.builder()
            .token(token)
            .userId(
                    user.getId().toHexString()
            )
            .name(user.getName())
            .email(user.getEmail())
            .build();
}


}
