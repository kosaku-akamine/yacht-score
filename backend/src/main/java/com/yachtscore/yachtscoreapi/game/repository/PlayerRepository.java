package com.yachtscore.yachtscoreapi.game.repository;

import com.yachtscore.yachtscoreapi.game.entity.PlayerEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlayerRepository
        extends JpaRepository<PlayerEntity, String> {

    List<PlayerEntity> findByGame_GameCode(String gameCode);
}