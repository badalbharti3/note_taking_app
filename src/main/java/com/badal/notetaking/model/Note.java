package com.badal.notetaking.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notes")
public class Note {

    @Id
    private ObjectId id;

    /*
     * ID of the user who owns this note.
     */
    private ObjectId userId;

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