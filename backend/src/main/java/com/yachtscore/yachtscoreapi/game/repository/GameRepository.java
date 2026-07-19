package com.yachtscore.yachtscoreapi.game.repository;

import com.yachtscore.yachtscoreapi.game.entity.GameEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GameRepository extends JpaRepository<GameEntity, String> {
}