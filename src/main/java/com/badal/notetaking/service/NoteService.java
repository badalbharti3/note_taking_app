package com.badal.notetaking.service;

import com.badal.notetaking.dto.NoteRequest;
import com.badal.notetaking.dto.NoteResponse;
import com.badal.notetaking.exception.InvalidNoteIdException;
import com.badal.notetaking.exception.NoteNotFoundException;
import com.badal.notetaking.model.Note;
import com.badal.notetaking.model.User;
import com.badal.notetaking.repository.NoteRepository;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class NoteService {

    private final NoteRepository noteRepository;

    private final CurrentUserService currentUserService;

    public NoteService(
            NoteRepository noteRepository,
            CurrentUserService currentUserService) {

        this.noteRepository = noteRepository;
        this.currentUserService = currentUserService;
    }

    // =========================================================
    // CREATE NOTE
    // =========================================================

    public NoteResponse createNote(
            NoteRequest request) {

        User currentUser =
                currentUserService.getCurrentUser();

        LocalDateTime now =
                LocalDateTime.now();

        Note note = Note.builder()
                .userId(currentUser.getId())
                .title(request.getTitle())
                .content(request.getContent())
                .category(request.getCategory())
                .tags(request.getTags())
                .pinned(request.isPinned())
                .favorite(request.isFavorite())
                .archived(request.isArchived())
                .createdAt(now)
                .updatedAt(now)
                .build();

        Note savedNote =
                noteRepository.save(note);

        return convertToResponse(savedNote);
    }

    // =========================================================
    // GET ALL NOTES
    // =========================================================

    public Page<NoteResponse> getAllNotes(
            int page,
            int size,
            String sortBy,
            String direction) {

        User currentUser =
                currentUserService.getCurrentUser();

        Pageable pageable =
                createPageable(
                        page,
                        size,
                        sortBy,
                        direction
                );

        return noteRepository
                .findByUserId(
                        currentUser.getId(),
                        pageable
                )
                .map(this::convertToResponse);
    }

    // =========================================================
    // GET NOTE BY ID
    // =========================================================

    public NoteResponse getNoteById(
            String id) {

        User currentUser =
                currentUserService.getCurrentUser();

        ObjectId objectId =
                validateAndConvertId(id);

        Note note =
                noteRepository
                        .findByIdAndUserId(
                                objectId,
                                currentUser.getId()
                        )
                        .orElseThrow(() ->
                                new NoteNotFoundException(
                                        "Note not found with id: "
                                                + id
                                )
                        );

        return convertToResponse(note);
    }

    // =========================================================
    // SEARCH NOTES
    // =========================================================

    public Page<NoteResponse> searchNotes(
            String keyword,
            int page,
            int size,
            String sortBy,
            String direction) {

        User currentUser =
                currentUserService.getCurrentUser();

        Pageable pageable =
                createPageable(
                        page,
                        size,
                        sortBy,
                        direction
                );

        return noteRepository
                .searchNotesByUser(
                        currentUser.getId(),
                        keyword,
                        pageable
                )
                .map(this::convertToResponse);
    }

    // =========================================================
    // GET PINNED NOTES
    // =========================================================

    public Page<NoteResponse> getPinnedNotes(
            int page,
            int size,
            String sortBy,
            String direction) {

        User currentUser =
                currentUserService.getCurrentUser();

        Pageable pageable =
                createPageable(
                        page,
                        size,
                        sortBy,
                        direction
                );

        return noteRepository
                .findByUserIdAndPinnedTrue(
                        currentUser.getId(),
                        pageable
                )
                .map(this::convertToResponse);
    }

    // =========================================================
    // GET FAVORITE NOTES
    // =========================================================

    public Page<NoteResponse> getFavoriteNotes(
            int page,
            int size,
            String sortBy,
            String direction) {

        User currentUser =
                currentUserService.getCurrentUser();

        Pageable pageable =
                createPageable(
                        page,
                        size,
                        sortBy,
                        direction
                );

        return noteRepository
                .findByUserIdAndFavoriteTrue(
                        currentUser.getId(),
                        pageable
                )
                .map(this::convertToResponse);
    }

    // =========================================================
    // UPDATE NOTE
    // =========================================================

    public NoteResponse updateNote(
            String id,
            NoteRequest request) {

        User currentUser =
                currentUserService.getCurrentUser();

        ObjectId objectId =
                validateAndConvertId(id);

        Note existingNote =
                noteRepository
                        .findByIdAndUserId(
                                objectId,
                                currentUser.getId()
                        )
                        .orElseThrow(() ->
                                new NoteNotFoundException(
                                        "Note not found with id: "
                                                + id
                                )
                        );

        existingNote.setTitle(
                request.getTitle()
        );

        existingNote.setContent(
                request.getContent()
        );

        existingNote.setCategory(
                request.getCategory()
        );

        existingNote.setTags(
                request.getTags()
        );

        existingNote.setPinned(
                request.isPinned()
        );

        existingNote.setFavorite(
                request.isFavorite()
        );

        existingNote.setArchived(
                request.isArchived()
        );

        existingNote.setUpdatedAt(
                LocalDateTime.now()
        );

        Note updatedNote =
                noteRepository.save(
                        existingNote
                );

        return convertToResponse(
                updatedNote
        );
    }

    // =========================================================
    // DELETE NOTE
    // =========================================================

    public void deleteNote(
            String id) {

        User currentUser =
                currentUserService.getCurrentUser();

        ObjectId objectId =
                validateAndConvertId(id);

        boolean exists =
                noteRepository
                        .existsByIdAndUserId(
                                objectId,
                                currentUser.getId()
                        );

        if (!exists) {

            throw new NoteNotFoundException(
                    "Note not found with id: " + id
            );
        }

        noteRepository.deleteById(
                objectId
        );
    }

    // =========================================================
    // PAGINATION + SORTING
    // =========================================================

    private Pageable createPageable(
            int page,
            int size,
            String sortBy,
            String direction) {

        Sort.Direction sortDirection;

        try {

            sortDirection =
                    Sort.Direction.fromString(
                            direction
                    );

        } catch (IllegalArgumentException exception) {

            sortDirection =
                    Sort.Direction.DESC;
        }

        /*
         * Prevent invalid page size.
         */
        if (size <= 0) {
            size = 10;
        }

        /*
         * Prevent negative page number.
         */
        if (page < 0) {
            page = 0;
        }

        /*
         * Only allow valid sortable fields.
         */
        if (!isValidSortField(sortBy)) {

            sortBy = "createdAt";
        }

        Sort sort =
                Sort.by(
                        sortDirection,
                        sortBy
                );

        return PageRequest.of(
                page,
                size,
                sort
        );
    }

    // =========================================================
    // SORT FIELD VALIDATION
    // =========================================================

    private boolean isValidSortField(
            String sortBy) {

        return sortBy.equals("createdAt")
                || sortBy.equals("updatedAt")
                || sortBy.equals("title")
                || sortBy.equals("category");
    }

    // =========================================================
    // OBJECT ID VALIDATION
    // =========================================================

    private ObjectId validateAndConvertId(
            String id) {

        if (!ObjectId.isValid(id)) {

            throw new InvalidNoteIdException(
                    "Invalid note ID: " + id
            );
        }

        return new ObjectId(id);
    }

    // =========================================================
    // ENTITY → RESPONSE DTO
    // =========================================================

    private NoteResponse convertToResponse(
            Note note) {

        return NoteResponse.builder()
                .id(
                        note.getId()
                                .toHexString()
                )
                .title(
                        note.getTitle()
                )
                .content(
                        note.getContent()
                )
                .category(
                        note.getCategory()
                )
                .tags(
                        note.getTags()
                )
                .pinned(
                        note.isPinned()
                )
                .favorite(
                        note.isFavorite()
                )
                .archived(
                        note.isArchived()
                )
                .createdAt(
                        note.getCreatedAt()
                )
                .updatedAt(
                        note.getUpdatedAt()
                )
                .build();
    }
}