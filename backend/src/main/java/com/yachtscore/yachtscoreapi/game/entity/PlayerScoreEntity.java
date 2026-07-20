package com.yachtscore.yachtscoreapi.game.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "player_scores",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_player_scores_player_category",
                        columnNames = {
                                "player_id",
                                "category_id"
                        }
                )
        }
)
public class PlayerScoreEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "player_id",
            nullable = false
    )
    private PlayerEntity player;

    @Column(
            name = "category_id",
            nullable = false,
            length = 50
    )
    private String categoryId;

    @Column(
            name = "score",
            nullable = false
    )
    private Integer score;

    protected PlayerScoreEntity() {
    }

    public PlayerScoreEntity(
            PlayerEntity player,
            String categoryId,
            Integer score
    ) {
        this.player = player;
        this.categoryId = categoryId;
        this.score = score;
    }

    public Long getId() {
        return id;
    }

    public PlayerEntity getPlayer() {
        return player;
    }

    public String getCategoryId() {
        return categoryId;
    }

    public Integer getScore() {
        return score;
    }

    public void updateScore(Integer score) {
        this.score = score;
    }
}