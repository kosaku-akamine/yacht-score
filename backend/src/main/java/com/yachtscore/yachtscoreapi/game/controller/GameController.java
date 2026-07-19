package com.yachtscore.yachtscoreapi.game.controller;

import com.yachtscore.yachtscoreapi.game.dto.CreatePlayerRequest;
import com.yachtscore.yachtscoreapi.game.dto.GameResponse;
import com.yachtscore.yachtscoreapi.game.dto.PlayerResponse;
import com.yachtscore.yachtscoreapi.game.service.GameService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/games")
@CrossOrigin(origins = "https://yacht-score.vercel.app")
public class GameController {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @PostMapping
    public ResponseEntity<GameResponse> createGame() {
        GameResponse gameResponse = gameService.createGame();

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(gameResponse);
    }

    @GetMapping("/{gameCode}")
    public GameResponse getGame(
            @PathVariable String gameCode
    ) {
        return gameService.getGame(gameCode);
    }

    @PostMapping("/{gameCode}/players")
    public ResponseEntity<PlayerResponse> createPlayer(
            @PathVariable String gameCode,
            @RequestBody CreatePlayerRequest request
    ) {
        PlayerResponse playerResponse = gameService.createPlayer(
                gameCode,
                request.name()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(playerResponse);
    }
}