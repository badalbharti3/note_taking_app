package com.badal.notetaking.exception;

public class InvalidNoteIdException extends RuntimeException {

    public InvalidNoteIdException(String message) {
        super(message);
    }
}