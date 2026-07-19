package com.yachtscore.yachtscoreapi.game.dto;

import java.util.List;

public record GameResponse(
        String gameCode,
        List<PlayerResponse> players
) {
}