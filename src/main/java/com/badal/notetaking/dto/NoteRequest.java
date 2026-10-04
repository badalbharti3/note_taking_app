package com.badal.notetaking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class NoteRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 100, message = "Title cannot exceed 100 characters")
    private String title;

    @NotBlank(message = "Content is required")
    private String content;

    private String category;

    private List<String> tags;

    private boolean pinned;

    private boolean favorite;

    private boolean archived;
}