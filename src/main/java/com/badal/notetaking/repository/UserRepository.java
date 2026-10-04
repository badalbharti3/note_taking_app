package com.badal.notetaking.repository;

import com.badal.notetaking.model.User;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface UserRepository extends MongoRepository<User, ObjectId> {


Optional<User> findByEmail(String email);

boolean existsByEmail(String email);


}
