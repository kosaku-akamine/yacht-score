package com.yachtscore.yachtscoreapi.game.service;

import com.yachtscore.yachtscoreapi.game.dto.GameResponse;
import com.yachtscore.yachtscoreapi.game.dto.PlayerResponse;
import com.yachtscore.yachtscoreapi.game.entity.GameEntity;
import com.yachtscore.yachtscoreapi.game.entity.PlayerEntity;
import com.yachtscore.yachtscoreapi.game.exception.GameNotFoundException;
import com.yachtscore.yachtscoreapi.game.repository.GameRepository;
import com.yachtscore.yachtscoreapi.game.repository.PlayerRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class GameService {

    private static final int GAME_CODE_LENGTH = 6;
    private static final int PLAYER_ID_LENGTH = 8;

    private final GameRepository gameRepository;
    private final PlayerRepository playerRepository;

    public GameService(
            GameRepository gameRepository,
            PlayerRepository playerRepository
    ) {
        this.gameRepository = gameRepository;
        this.playerRepository = playerRepository;
    }

    public GameResponse createGame() {
        String gameCode = generateUniqueGameCode();

        gameRepository.save(new GameEntity(gameCode));

        return new GameResponse(
                gameCode,
                List.of()
        );
    }

    public GameResponse getGame(String gameCode) {
        validateGameExists(gameCode);

        List<PlayerResponse> players =
                playerRepository.findByGame_GameCode(gameCode)
                        .stream()
                        .map(player -> new PlayerResponse(
                                player.getId(),
                                player.getName()
                        ))
                        .toList();

        return new GameResponse(
                gameCode,
                players
        );
    }

    public PlayerResponse createPlayer(
            String gameCode,
            String playerName
    ) {
        GameEntity game = gameRepository.findById(gameCode)
                .orElseThrow(() -> new GameNotFoundException(gameCode));

        PlayerEntity player = new PlayerEntity(
                generatePlayerId(),
                playerName,
                game
        );

        playerRepository.save(player);

        return new PlayerResponse(
                player.getId(),
                player.getName()
        );
    }

    private void validateGameExists(String gameCode) {
        if (!gameRepository.existsById(gameCode)) {
            throw new GameNotFoundException(gameCode);
        }
    }

    private String generateUniqueGameCode() {
        String gameCode;

        do {
            gameCode = UUID.randomUUID()
                    .toString()
                    .replace("-", "")
                    .substring(0, GAME_CODE_LENGTH)
                    .toUpperCase();
        } while (gameRepository.existsById(gameCode));

        return gameCode;
    }

    private String generatePlayerId() {
        return UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, PLAYER_ID_LENGTH)
                .toUpperCase();
    }
}