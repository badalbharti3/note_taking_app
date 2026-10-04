package com.badal.notetaking.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

@ExceptionHandler(NoteNotFoundException.class)
public ResponseEntity<Map<String, Object>> handleNoteNotFound(
        NoteNotFoundException exception) {

    Map<String, Object> response =
            new HashMap<>();

    response.put("success", false);
    response.put("message", exception.getMessage());
    response.put("status", 404);
    response.put("timestamp", LocalDateTime.now());

    return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(response);
}


@ExceptionHandler(InvalidNoteIdException.class)
public ResponseEntity<Map<String, Object>> handleInvalidNoteId(
        InvalidNoteIdException exception) {

    Map<String, Object> response =
            new HashMap<>();

    response.put("success", false);
    response.put("message", exception.getMessage());
    response.put("status", 400);
    response.put("timestamp", LocalDateTime.now());

    return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(response);
}


@ExceptionHandler(UserAlreadyExistsException.class)
public ResponseEntity<Map<String, Object>> handleUserAlreadyExists(
        UserAlreadyExistsException exception) {

    Map<String, Object> response =
            new HashMap<>();

    response.put("success", false);
    response.put("message", exception.getMessage());
    response.put("status", 409);
    response.put("timestamp", LocalDateTime.now());

    return ResponseEntity
            .status(HttpStatus.CONFLICT)
            .body(response);
}


@ExceptionHandler(IllegalArgumentException.class)
public ResponseEntity<Map<String, Object>> handleIllegalArgument(
        IllegalArgumentException exception) {

    Map<String, Object> response =
            new HashMap<>();

    response.put("success", false);
    response.put("message", exception.getMessage());
    response.put("status", 401);
    response.put("timestamp", LocalDateTime.now());

    return ResponseEntity
            .status(HttpStatus.UNAUTHORIZED)
            .body(response);
}


@ExceptionHandler(MethodArgumentNotValidException.class)
public ResponseEntity<Map<String, Object>> handleValidation(
        MethodArgumentNotValidException exception) {

    Map<String, String> errors =
            new HashMap<>();

    exception.getBindingResult()
            .getFieldErrors()
            .forEach(error ->
                    errors.put(
                            error.getField(),
                            error.getDefaultMessage()
                    )
            );

    Map<String, Object> response =
            new HashMap<>();

    response.put("success", false);
    response.put("message", "Validation failed");
    response.put("status", 400);
    response.put("errors", errors);
    response.put("timestamp", LocalDateTime.now());

    return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(response);
}


}
