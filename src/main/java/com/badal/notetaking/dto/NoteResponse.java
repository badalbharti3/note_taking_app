package com.badal.notetaking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NoteResponse {

    private String id;

    private String title;

    private String content;

    private String category;

    private List<String> tags;

    private boolean pinned;

    private boolean favorite;

    private boolean archived;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}