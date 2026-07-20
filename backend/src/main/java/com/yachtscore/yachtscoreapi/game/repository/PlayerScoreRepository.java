package com.yachtscore.yachtscoreapi.game.repository;

import com.yachtscore.yachtscoreapi.game.entity.PlayerScoreEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlayerScoreRepository
        extends JpaRepository<PlayerScoreEntity, Long> {

    Optional<PlayerScoreEntity> findByPlayer_IdAndCategoryId(
            String playerId,
            String categoryId
    );

    List<PlayerScoreEntity> findByPlayer_Id(String playerId);
}