package com.yachtscore.yachtscoreapi.game.exception;

public class PlayerNotFoundException extends RuntimeException {

    public PlayerNotFoundException(String playerId) {
        super("Player not found: " + playerId);
    }
}