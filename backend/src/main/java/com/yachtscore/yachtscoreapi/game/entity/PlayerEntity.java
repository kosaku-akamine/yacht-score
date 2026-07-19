package com.yachtscore.yachtscoreapi.game.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "players")
public class PlayerEntity {

    @Id
    private String id;

    private String name;

    @ManyToOne
    @JoinColumn(name = "game_code", nullable = false)
    private GameEntity game;

    protected PlayerEntity() {
    }

    public PlayerEntity(
            String id,
            String name,
            GameEntity game
    ) {
        this.id = id;
        this.name = name;
        this.game = game;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public GameEntity getGame() {
        return game;
    }
}