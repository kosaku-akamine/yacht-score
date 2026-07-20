package com.yachtscore.yachtscoreapi.game.dto;

import java.util.Map;

public record PlayerResponse(
        String id,
        String name,
        Map<String,Integer> scores
) {
}