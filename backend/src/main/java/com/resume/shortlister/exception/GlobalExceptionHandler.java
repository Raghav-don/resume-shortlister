package com.resume.shortlister.exception;

import com.resume.shortlister.dto.ErrorResponse;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    private static final int REQUEST_ID_LENGTH = 8;

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errors.put(error.getField(), error.getDefaultMessage());
        }

        String requestId = UUID.randomUUID().toString().substring(0, REQUEST_ID_LENGTH);
        log.warn("[{}] Validation failed: {}", requestId, errors);

        return ResponseEntity.badRequest()
                .body(ErrorResponse.builder()
                        .timestamp(Instant.now())
                        .status(HttpStatus.BAD_REQUEST.value())
                        .error("Validation Failed")
                        .message("Invalid request parameters")
                        .requestId(requestId)
                        .details(errors)
                        .build());
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(ConstraintViolationException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getConstraintViolations().forEach(v ->
            errors.put(v.getPropertyPath().toString(), v.getMessage())
        );

        String requestId = UUID.randomUUID().toString().substring(0, REQUEST_ID_LENGTH);
        log.warn("[{}] Constraint violation: {}", requestId, errors);

        return ResponseEntity.badRequest()
                .body(ErrorResponse.builder()
                        .timestamp(Instant.now())
                        .status(HttpStatus.BAD_REQUEST.value())
                        .error("Constraint Violation")
                        .message("Invalid request parameters")
                        .requestId(requestId)
                        .details(errors)
                        .build());
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleEntityNotFound(EntityNotFoundException ex) {
        String requestId = UUID.randomUUID().toString().substring(0, REQUEST_ID_LENGTH);
        log.warn("[{}] Entity not found: {}", requestId, ex.getMessage());

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ErrorResponse.builder()
                        .timestamp(Instant.now())
                        .status(HttpStatus.NOT_FOUND.value())
                        .error("Not Found")
                        .message(ex.getMessage())
                        .requestId(requestId)
                        .build());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        String requestId = UUID.randomUUID().toString().substring(0, REQUEST_ID_LENGTH);
        log.warn("[{}] Illegal argument: {}", requestId, ex.getMessage());

        return ResponseEntity.badRequest()
                .body(ErrorResponse.builder()
                        .timestamp(Instant.now())
                        .status(HttpStatus.BAD_REQUEST.value())
                        .error("Bad Request")
                        .message(ex.getMessage())
                        .requestId(requestId)
                        .build());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        String requestId = UUID.randomUUID().toString().substring(0, REQUEST_ID_LENGTH);
        String message = ex.getMostSpecificCause() != null
            ? ex.getMostSpecificCause().getMessage()
            : ex.getMessage();
        log.warn("[{}] Data integrity violation: {}", requestId, message);

        String userMessage = "A data conflict occurred";
        if (message != null && message.contains("unique")) {
            userMessage = "A record with this value already exists";
        } else if (message != null && message.contains("foreign key")) {
            userMessage = "Referenced record does not exist";
        }

        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ErrorResponse.builder()
                        .timestamp(Instant.now())
                        .status(HttpStatus.CONFLICT.value())
                        .error("Conflict")
                        .message(userMessage)
                        .requestId(requestId)
                        .build());
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException ex) {
        String requestId = UUID.randomUUID().toString().substring(0, REQUEST_ID_LENGTH);
        log.warn("[{}] Authentication failed: {}", requestId, ex.getMessage());

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse.builder()
                        .timestamp(Instant.now())
                        .status(HttpStatus.UNAUTHORIZED.value())
                        .error("Unauthorized")
                        .message("Invalid email or password")
                        .requestId(requestId)
                        .build());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        String requestId = UUID.randomUUID().toString().substring(0, REQUEST_ID_LENGTH);
        log.warn("[{}] Access denied: {}", requestId, ex.getMessage());

        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ErrorResponse.builder()
                        .timestamp(Instant.now())
                        .status(HttpStatus.FORBIDDEN.value())
                        .error("Forbidden")
                        .message("Insufficient permissions to access this resource")
                        .requestId(requestId)
                        .build());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        String requestId = UUID.randomUUID().toString().substring(0, REQUEST_ID_LENGTH);
        log.warn("[{}] Malformed request: {}", requestId, ex.getMessage());

        return ResponseEntity.badRequest()
                .body(ErrorResponse.builder()
                        .timestamp(Instant.now())
                        .status(HttpStatus.BAD_REQUEST.value())
                        .error("Malformed Request")
                        .message("Request body is invalid or missing")
                        .requestId(requestId)
                        .build());
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingParameter(MissingServletRequestParameterException ex) {
        String requestId = UUID.randomUUID().toString().substring(0, REQUEST_ID_LENGTH);
        log.warn("[{}] Missing parameter: {}", requestId, ex.getParameterName());

        return ResponseEntity.badRequest()
                .body(ErrorResponse.builder()
                        .timestamp(Instant.now())
                        .status(HttpStatus.BAD_REQUEST.value())
                        .error("Bad Request")
                        .message("Required parameter '" + ex.getParameterName() + "' is missing")
                        .requestId(requestId)
                        .build());
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String requestId = UUID.randomUUID().toString().substring(0, REQUEST_ID_LENGTH);
        log.warn("[{}] Type mismatch: {} should be {}", requestId, ex.getName(), ex.getRequiredType().getSimpleName());

        return ResponseEntity.badRequest()
                .body(ErrorResponse.builder()
                        .timestamp(Instant.now())
                        .status(HttpStatus.BAD_REQUEST.value())
                        .error("Bad Request")
                        .message("Parameter '" + ex.getName() + "' must be of type "
                                + ex.getRequiredType().getSimpleName())
                        .requestId(requestId)
                        .build());
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoResourceFound(NoResourceFoundException ex) {
        String requestId = UUID.randomUUID().toString().substring(0, REQUEST_ID_LENGTH);
        log.warn("[{}] Resource not found: {}", requestId, ex.getResourcePath());

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ErrorResponse.builder()
                        .timestamp(Instant.now())
                        .status(HttpStatus.NOT_FOUND.value())
                        .error("Not Found")
                        .message("The requested resource was not found")
                        .requestId(requestId)
                        .build());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        String requestId = UUID.randomUUID().toString().substring(0, REQUEST_ID_LENGTH);
        log.error("[{}] Unhandled exception: {}", requestId, ex.getMessage(), ex);

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.builder()
                        .timestamp(Instant.now())
                        .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                        .error("Internal Server Error")
                        .message("An unexpected error occurred. Please try again later.")
                        .requestId(requestId)
                        .build());
    }
}