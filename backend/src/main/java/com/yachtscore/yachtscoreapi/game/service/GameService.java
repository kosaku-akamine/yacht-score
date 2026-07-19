package com.yachtscore.yachtscoreapi.game.service;

import com.yachtscore.yachtscoreapi.game.dto.GameResponse;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GameService {

    public GameResponse getGame(String gameCode) {
        return new GameResponse(
                gameCode,
                List.of()
        );
    }
}