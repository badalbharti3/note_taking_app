package com.badal.notetaking.controller;

import com.badal.notetaking.dto.NoteRequest;
import com.badal.notetaking.dto.NoteResponse;
import com.badal.notetaking.service.NoteService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notes")
public class NoteController {

    private final NoteService noteService;

    public NoteController(NoteService noteService) {
        this.noteService = noteService;
    }

    @PostMapping
    public ResponseEntity<NoteResponse> createNote(
            @Valid @RequestBody NoteRequest request) {

        return ResponseEntity.ok(
                noteService.createNote(request)
        );
    }

    @GetMapping
    public ResponseEntity<Page<NoteResponse>> getAllNotes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        return ResponseEntity.ok(
                noteService.getAllNotes(
                        page,
                        size,
                        sortBy,
                        direction
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<NoteResponse> getNoteById(
            @PathVariable String id) {

        return ResponseEntity.ok(
                noteService.getNoteById(id)
        );
    }

    @GetMapping("/search")
    public ResponseEntity<Page<NoteResponse>> searchNotes(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        return ResponseEntity.ok(
                noteService.searchNotes(
                        keyword,
                        page,
                        size,
                        sortBy,
                        direction
                )
        );
    }

    @GetMapping("/pinned")
    public ResponseEntity<Page<NoteResponse>> getPinnedNotes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        return ResponseEntity.ok(
                noteService.getPinnedNotes(
                        page,
                        size,
                        sortBy,
                        direction
                )
        );
    }

    @GetMapping("/favorites")
    public ResponseEntity<Page<NoteResponse>> getFavoriteNotes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        return ResponseEntity.ok(
                noteService.getFavoriteNotes(
                        page,
                        size,
                        sortBy,
                        direction
                )
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<NoteResponse> updateNote(
            @PathVariable String id,
            @Valid @RequestBody NoteRequest request) {

        return ResponseEntity.ok(
                noteService.updateNote(
                        id,
                        request
                )
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(
            @PathVariable String id) {

        noteService.deleteNote(id);

        return ResponseEntity.noContent().build();
    }
}