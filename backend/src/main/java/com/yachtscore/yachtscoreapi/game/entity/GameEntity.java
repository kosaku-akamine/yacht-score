package com.yachtscore.yachtscoreapi.game.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "games")
public class GameEntity {

    @Id
    private String gameCode;

    protected GameEntity() {
    }

    public GameEntity(String gameCode) {
        this.gameCode = gameCode;
    }

    public String getGameCode() {
        return gameCode;
    }
}