package com.yachtscore.yachtscoreapi.game.service;

import com.yachtscore.yachtscoreapi.game.dto.GameResponse;
import com.yachtscore.yachtscoreapi.game.dto.PlayerResponse;
import com.yachtscore.yachtscoreapi.game.entity.GameEntity;
import com.yachtscore.yachtscoreapi.game.entity.PlayerEntity;
import com.yachtscore.yachtscoreapi.game.entity.PlayerScoreEntity;
import com.yachtscore.yachtscoreapi.game.exception.GameNotFoundException;
import com.yachtscore.yachtscoreapi.game.exception.PlayerNotFoundException;
import com.yachtscore.yachtscoreapi.game.repository.GameRepository;
import com.yachtscore.yachtscoreapi.game.repository.PlayerRepository;
import com.yachtscore.yachtscoreapi.game.repository.PlayerScoreRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class GameService {

    private static final int GAME_CODE_LENGTH = 6;
    private static final int PLAYER_ID_LENGTH = 8;

    private final GameRepository gameRepository;
    private final PlayerRepository playerRepository;
    private final PlayerScoreRepository playerScoreRepository;

    public GameService(
            GameRepository gameRepository,
            PlayerRepository playerRepository,
            PlayerScoreRepository playerScoreRepository
    ) {
        this.gameRepository = gameRepository;
        this.playerRepository = playerRepository;
        this.playerScoreRepository = playerScoreRepository;
    }

    public GameResponse createGame() {
        String gameCode = generateUniqueGameCode();

        gameRepository.save(new GameEntity(gameCode));

        return new GameResponse(
                gameCode,
                List.of()
        );
    }

    @Transactional(readOnly = true)
    public GameResponse getGame(String gameCode) {
        String normalizedGameCode = gameCode.toUpperCase();

        validateGameExists(normalizedGameCode);

        List<PlayerResponse> players =
                playerRepository.findByGame_GameCode(normalizedGameCode)
                        .stream()
                        .map(this::toPlayerResponse)
                        .toList();

        return new GameResponse(
                normalizedGameCode,
                players
        );
    }

    public PlayerResponse createPlayer(
            String gameCode,
            String playerName
    ) {
        String normalizedGameCode = gameCode.toUpperCase();
        String normalizedPlayerName =
                playerName == null ? "" : playerName.trim();

        if (normalizedPlayerName.isEmpty()) {
            throw new IllegalArgumentException(
                    "Player name is required"
            );
        }

        GameEntity game = gameRepository.findById(normalizedGameCode)
                .orElseThrow(
                        () -> new GameNotFoundException(
                                normalizedGameCode
                        )
                );

        PlayerEntity player = new PlayerEntity(
                generatePlayerId(),
                normalizedPlayerName,
                game
        );

        playerRepository.save(player);

        return toPlayerResponse(player);
    }

    @Transactional
    public PlayerResponse updateScore(
            String gameCode,
            String playerId,
            String categoryId,
            Integer score
    ) {
        String normalizedGameCode = gameCode.toUpperCase();

        validateScore(categoryId, score);

        PlayerEntity player = playerRepository.findById(playerId)
                .filter(playerEntity ->
                        playerEntity
                                .getGame()
                                .getGameCode()
                                .equals(normalizedGameCode)
                )
                .orElseThrow(
                        () -> new PlayerNotFoundException(playerId)
                );

        PlayerScoreEntity playerScore =
                playerScoreRepository
                        .findByPlayer_IdAndCategoryId(
                                playerId,
                                categoryId
                        )
                        .orElseGet(
                                () -> new PlayerScoreEntity(
                                        player,
                                        categoryId,
                                        score
                                )
                        );

        playerScore.updateScore(score);

        playerScoreRepository.save(playerScore);

        return toPlayerResponse(player);
    }

    private PlayerResponse toPlayerResponse(
            PlayerEntity player
    ) {
        List<PlayerScoreEntity> playerScores =
                playerScoreRepository.findByPlayer_Id(
                        player.getId()
                );

        Map<String, Integer> scores =
                new LinkedHashMap<>();

        for (PlayerScoreEntity playerScore : playerScores) {
            scores.put(
                    playerScore.getCategoryId(),
                    playerScore.getScore()
            );
        }

        return new PlayerResponse(
                player.getId(),
                player.getName(),
                scores
        );
    }

    private void validateGameExists(String gameCode) {
        if (!gameRepository.existsById(gameCode)) {
            throw new GameNotFoundException(gameCode);
        }
    }

    private void validateScore(
            String categoryId,
            Integer score
    ) {
        if (score == null) {
            throw new IllegalArgumentException(
                    "Score is required"
            );
        }

        switch (categoryId) {
            case "aces" ->
                    validateRange(categoryId, score, 0, 5);

            case "deuces" ->
                    validateRange(categoryId, score, 0, 10);

            case "threes" ->
                    validateRange(categoryId, score, 0, 15);

            case "fours" ->
                    validateRange(categoryId, score, 0, 20);

            case "fives" ->
                    validateRange(categoryId, score, 0, 25);

            case "sixes",
                 "four-of-a-kind",
                 "choice" ->
                    validateRange(categoryId, score, 0, 30);

            case "full-house" ->
                    validateFixedScore(
                            categoryId,
                            score,
                            25
                    );

            case "small-straight" ->
                    validateFixedScore(
                            categoryId,
                            score,
                            30
                    );

            case "large-straight" ->
                    validateFixedScore(
                            categoryId,
                            score,
                            40
                    );

            case "yacht" ->
                    validateRange(
                            categoryId,
                            score,
                            0,
                            10000
                    );

            default ->
                    throw new IllegalArgumentException(
                            "Unknown category: " + categoryId
                    );
        }
    }

    private void validateRange(
            String categoryId,
            int score,
            int minScore,
            int maxScore
    ) {
        if (score < minScore || score > maxScore) {
            throw new IllegalArgumentException(
                    categoryId
                            + " must be between "
                            + minScore
                            + " and "
                            + maxScore
            );
        }
    }

    private void validateFixedScore(
            String categoryId,
            int score,
            int fixedScore
    ) {
        if (score != 0 && score != fixedScore) {
            throw new IllegalArgumentException(
                    categoryId
                            + " must be 0 or "
                            + fixedScore
            );
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