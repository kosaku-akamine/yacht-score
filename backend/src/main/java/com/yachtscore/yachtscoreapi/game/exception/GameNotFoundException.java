package com.yachtscore.yachtscoreapi.game.exception;

public class GameNotFoundException extends RuntimeException {

    public GameNotFoundException(String gameCode) {
        super("Game not found: " + gameCode);
    }
}