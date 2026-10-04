package com.badal.notetaking.repository;

import com.badal.notetaking.model.Note;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.Optional;

public interface NoteRepository
        extends MongoRepository<Note, ObjectId> {

    /*
     * Get all notes belonging to a specific user.
     */
    Page<Note> findByUserId(
            ObjectId userId,
            Pageable pageable
    );

    /*
     * Get one specific note only if it belongs to the user.
     */
    Optional<Note> findByIdAndUserId(
            ObjectId id,
            ObjectId userId
    );

    /*
     * Search title/content only inside the current user's notes.
     */
    @Query("""
            {
                'userId': ?0,
                '$or': [
                    {
                        'title': {
                            '$regex': ?1,
                            '$options': 'i'
                        }
                    },
                    {
                        'content': {
                            '$regex': ?1,
                            '$options': 'i'
                        }
                    }
                ]
            }
            """)
    Page<Note> searchNotesByUser(
            ObjectId userId,
            String keyword,
            Pageable pageable
    );

    /*
     * Get pinned notes belonging to a specific user.
     */
    Page<Note> findByUserIdAndPinnedTrue(
            ObjectId userId,
            Pageable pageable
    );

    /*
     * Get favorite notes belonging to a specific user.
     */
    Page<Note> findByUserIdAndFavoriteTrue(
            ObjectId userId,
            Pageable pageable
    );

    /*
     * Check whether a note belongs to a specific user.
     */
    boolean existsByIdAndUserId(
            ObjectId id,
            ObjectId userId
    );
}