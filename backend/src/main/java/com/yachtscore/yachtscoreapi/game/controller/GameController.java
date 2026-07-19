package com.yachtscore.yachtscoreapi.game.controller;

import com.yachtscore.yachtscoreapi.game.dto.GameResponse;
import com.yachtscore.yachtscoreapi.game.service.GameService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/games")
public class GameController {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @GetMapping("/{gameCode}")
    public GameResponse getGame(
            @PathVariable String gameCode
    ) {
        return gameService.getGame(gameCode);
    }
}