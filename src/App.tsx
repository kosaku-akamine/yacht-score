import { useEffect, useMemo, useState } from "react";
import "./App.css";

type Category = {
  id: string;
  name: string;
  minScore: number;
  maxScore: number;
  fixedScore?: number;
};

type PlayerResponse = {
  id: string;
  name: string;
  scores: Record<string, number>;
};

type GameResponse = {
  gameCode: string;
  players: PlayerResponse[];
};

type GameSession = {
  gameCode: string;
  playerId: string;
  playerName: string;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "https://yacht-score-production.up.railway.app";

const categories: Category[] = [
  { id: "aces", name: "エース", minScore: 0, maxScore: 5 },
  { id: "deuces", name: "デュース", minScore: 0, maxScore: 10 },
  { id: "threes", name: "トレイ", minScore: 0, maxScore: 15 },
  { id: "fours", name: "フォーズ", minScore: 0, maxScore: 20 },
  { id: "fives", name: "ファイブ", minScore: 0, maxScore: 25 },
  { id: "sixes", name: "シックス", minScore: 0, maxScore: 30 },
  {
    id: "three-of-a-kind",
    name: "スリーダイス",
    minScore: 0,
    maxScore: 30,
  },
  {
    id: "four-of-a-kind",
    name: "フォーダイス",
    minScore: 0,
    maxScore: 30,
  },
  {
    id: "full-house",
    name: "フルハウス",
    minScore: 0,
    maxScore: 25,
    fixedScore: 25,
  },
  {
    id: "small-straight",
    name: "S.ストレート",
    minScore: 0,
    maxScore: 30,
    fixedScore: 30,
  },
  {
    id: "large-straight",
    name: "L.ストレート",
    minScore: 0,
    maxScore: 40,
    fixedScore: 40,
  },
  { id: "yacht", name: "ヨット", minScore: 0, maxScore: 10000 },
  { id: "choice", name: "チョイス", minScore: 0, maxScore: 30 },
];

const loadSession = (): GameSession | null => {
  const savedSession = localStorage.getItem("yacht-session");

  if (!savedSession) {
    return null;
  }

  try {
    const parsed = JSON.parse(savedSession) as Partial<GameSession>;

    if (
      typeof parsed.gameCode !== "string" ||
      typeof parsed.playerId !== "string" ||
      typeof parsed.playerName !== "string"
    ) {
      localStorage.removeItem("yacht-session");
      return null;
    }

    return {
      gameCode: parsed.gameCode,
      playerId: parsed.playerId,
      playerName: parsed.playerName,
    };
  } catch {
    localStorage.removeItem("yacht-session");
    return null;
  }
};

const getPlayerScore = (
  player: PlayerResponse,
  categoryId: string,
): number | null => {
  const score = player.scores?.[categoryId];
  return typeof score === "number" ? score : null;
};

const calculateUpperScore = (player: PlayerResponse): number =>
  categories.slice(0, 6).reduce((total, category) => {
    return total + (getPlayerScore(player, category.id) ?? 0);
  }, 0);

const calculateBonusScore = (player: PlayerResponse): number =>
  calculateUpperScore(player) >= 63 ? 35 : 0;

const calculateTotalScore = (player: PlayerResponse): number => {
  const categoryTotal = categories.reduce((total, category) => {
    return total + (getPlayerScore(player, category.id) ?? 0);
  }, 0);

  return categoryTotal + calculateBonusScore(player);
};

function App() {
  const [session, setSession] = useState<GameSession | null>(() =>
    loadSession(),
  );
  const [game, setGame] = useState<GameResponse | null>(null);

  const [playerNameInput, setPlayerNameInput] = useState("");
  const [gameCodeInput, setGameCodeInput] = useState("");

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [scoreInput, setScoreInput] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [apiErrorMessage, setApiErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingScore, setIsSavingScore] = useState(false);

  const currentPlayer = useMemo(() => {
    if (!session || !game) {
      return null;
    }

    return (
      game.players.find((player) => player.id === session.playerId) ?? null
    );
  }, [game, session]);

  const selectedCategoryData = categories.find(
    (category) => category.id === selectedCategory,
  );

  const fetchGame = async (
    gameCode: string,
    showError = true,
  ): Promise<GameResponse | null> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/games/${encodeURIComponent(gameCode)}`,
      );

      if (!response.ok) {
        throw new Error(
          response.status === 404
            ? "ゲームが見つかりませんでした"
            : "ゲーム情報の取得に失敗しました",
        );
      }

      const gameResponse = (await response.json()) as GameResponse;
      setGame(gameResponse);

      if (showError) {
        setApiErrorMessage("");
      }

      return gameResponse;
    } catch (error) {
      if (showError) {
        setApiErrorMessage(
          error instanceof Error
            ? error.message
            : "サーバーとの通信に失敗しました",
        );
      }

      return null;
    }
  };

  useEffect(() => {
    if (!session) {
      setGame(null);
      return;
    }

    void fetchGame(session.gameCode);

    const intervalId = window.setInterval(() => {
      void fetchGame(session.gameCode, false);
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [session]);

  const saveSession = (
    gameCode: string,
    playerId: string,
    playerName: string,
  ) => {
    const newSession: GameSession = {
      gameCode,
      playerId,
      playerName,
    };

    localStorage.setItem("yacht-session", JSON.stringify(newSession));
    setSession(newSession);
  };

  const createPlayer = async (
    gameCode: string,
    playerName: string,
  ): Promise<PlayerResponse> => {
    const response = await fetch(
      `${API_BASE_URL}/api/games/${encodeURIComponent(gameCode)}/players`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: playerName,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        response.status === 404
          ? "ゲームが見つかりませんでした"
          : "プレイヤーの登録に失敗しました",
      );
    }

    return (await response.json()) as PlayerResponse;
  };

  const handleCreateGame = async () => {
    const playerName = playerNameInput.trim();

    if (!playerName) {
      setApiErrorMessage("名前を入力してください");
      return;
    }

    setIsLoading(true);
    setApiErrorMessage("");

    try {
      const gameResponse = await fetch(`${API_BASE_URL}/api/games`, {
        method: "POST",
      });

      if (!gameResponse.ok) {
        throw new Error("ゲームの作成に失敗しました");
      }

      const createdGame = (await gameResponse.json()) as GameResponse;
      const player = await createPlayer(createdGame.gameCode, playerName);

      saveSession(createdGame.gameCode, player.id, player.name);
    } catch (error) {
      setApiErrorMessage(
        error instanceof Error
          ? error.message
          : "サーバーとの通信に失敗しました",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGame = async () => {
    const playerName = playerNameInput.trim();
    const gameCode = gameCodeInput.trim().toUpperCase();

    if (!playerName) {
      setApiErrorMessage("名前を入力してください");
      return;
    }

    if (!gameCode) {
      setApiErrorMessage("ゲームコードを入力してください");
      return;
    }

    setIsLoading(true);
    setApiErrorMessage("");

    try {
      const player = await createPlayer(gameCode, playerName);

      saveSession(gameCode, player.id, player.name);
    } catch (error) {
      setApiErrorMessage(
        error instanceof Error
          ? error.message
          : "サーバーとの通信に失敗しました",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveGame = () => {
    if (!window.confirm("このゲームから退出しますか？")) {
      return;
    }

    localStorage.removeItem("yacht-session");

    setSession(null);
    setGame(null);
    setPlayerNameInput("");
    setGameCodeInput("");
    setSelectedCategory(null);
    setScoreInput("");
    setErrorMessage("");
    setApiErrorMessage("");
  };

  const handleSelectCategory = (categoryId: string) => {
    if (!currentPlayer) {
      return;
    }

    const currentScore = getPlayerScore(currentPlayer, categoryId);

    setSelectedCategory(categoryId);
    setScoreInput(currentScore === null ? "" : String(currentScore));
    setErrorMessage("");
  };

  const handleSaveScore = async () => {
    if (!session || !selectedCategory || scoreInput === "") {
      setErrorMessage("得点を入力してください");
      return;
    }

    const category = categories.find((item) => item.id === selectedCategory);

    if (!category) {
      return;
    }

    const score = Number(scoreInput);

    if (Number.isNaN(score)) {
      setErrorMessage("数字を入力してください");
      return;
    }

    if (!Number.isInteger(score)) {
      setErrorMessage("整数を入力してください");
      return;
    }

    if (score < category.minScore || score > category.maxScore) {
      setErrorMessage(
        `${category.name}は${category.minScore}〜${category.maxScore}点で入力してください`,
      );
      return;
    }

    if (
      category.fixedScore !== undefined &&
      score !== 0 &&
      score !== category.fixedScore
    ) {
      setErrorMessage(
        `${category.name}は0点または${category.fixedScore}点で入力してください`,
      );
      return;
    }

    setIsSavingScore(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/games/${encodeURIComponent(
          session.gameCode,
        )}/players/${encodeURIComponent(
          session.playerId,
        )}/scores/${encodeURIComponent(selectedCategory)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            score,
          }),
        },
      );

      if (!response.ok) {
        const message =
          response.status === 404
            ? "プレイヤーまたはゲームが見つかりませんでした"
            : "得点の保存に失敗しました";

        throw new Error(message);
      }

      const updatedPlayer = (await response.json()) as PlayerResponse;

      setGame((currentGame) => {
        if (!currentGame) {
          return currentGame;
        }

        return {
          ...currentGame,
          players: currentGame.players.map((player) =>
            player.id === updatedPlayer.id ? updatedPlayer : player,
          ),
        };
      });

      setSelectedCategory(null);
      setScoreInput("");
      setApiErrorMessage("");

      void fetchGame(session.gameCode, false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "サーバーとの通信に失敗しました",
      );
    } finally {
      setIsSavingScore(false);
    }
  };

  if (!session) {
    return (
      <main className="app">
        <header className="header">
          <div>
            <p className="subtitle">YACHT SCORE BOARD</p>
            <h1>ヨット</h1>
          </div>
        </header>

        <section className="entry-card">
          <h2>ゲームを始める</h2>

          <label className="form-field">
            <span>あなたの名前</span>
            <input
              type="text"
              maxLength={20}
              value={playerNameInput}
              onChange={(event) => {
                setPlayerNameInput(event.target.value);
                setApiErrorMessage("");
              }}
              placeholder="名前を入力"
            />
          </label>

          <button
            className="create-game-button"
            onClick={handleCreateGame}
            disabled={isLoading}
          >
            {isLoading ? "作成中..." : "新しいゲームを作る"}
          </button>

          <div className="entry-divider">
            <span>または</span>
          </div>

          <label className="form-field">
            <span>ゲームコード</span>
            <input
              type="text"
              maxLength={6}
              value={gameCodeInput}
              onChange={(event) => {
                setGameCodeInput(event.target.value.toUpperCase());
                setApiErrorMessage("");
              }}
              placeholder="例：E7CE16"
            />
          </label>

          <button
            className="join-game-button"
            onClick={handleJoinGame}
            disabled={isLoading}
          >
            {isLoading ? "参加中..." : "ゲームに参加する"}
          </button>

          {apiErrorMessage && (
            <p className="error-message">{apiErrorMessage}</p>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="app">
      <header className="header">
        <div>
          <p className="subtitle">YACHT SCORE BOARD</p>
          <h1>ヨット</h1>
        </div>
      </header>

      <section className="game-information">
        <div>
          <span>ゲームコード</span>
          <strong>{session.gameCode}</strong>
        </div>

        <div>
          <span>あなた</span>
          <strong>{session.playerName}</strong>
        </div>

        <button className="leave-button" onClick={handleLeaveGame}>
          退出
        </button>
      </section>

      {apiErrorMessage && <p className="error-message">{apiErrorMessage}</p>}

      {!game ? (
        <section className="entry-card">
          <p>ゲーム情報を読み込んでいます...</p>
        </section>
      ) : (
        <section className="players-section">
          <h2>参加者の得点</h2>

          <div className="players-list">
            {game.players.map((player) => {
              const isCurrentPlayer = player.id === session.playerId;
              const upperScore = calculateUpperScore(player);
              const bonusScore = calculateBonusScore(player);
              const totalScore = calculateTotalScore(player);

              return (
                <section
                  key={player.id}
                  className={`player-score-card ${
                    isCurrentPlayer ? "current-player" : ""
                  }`}
                >
                  <div className="player-score-header">
                    <div>
                      <p className="subtitle">
                        {isCurrentPlayer ? "あなたの得点" : "プレイヤー"}
                      </p>
                      <h2>{player.name}</h2>
                    </div>

                    <div className="player-total-score">
                      <span>合計</span>
                      <strong>{totalScore}</strong>
                      <span>点</span>
                    </div>
                  </div>

                  <div className="score-list">
                    {categories.map((category) => {
                      const score = getPlayerScore(player, category.id);
                      const isUsed = score !== null;

                      return (
                        <div
                          key={category.id}
                          className={`score-row ${isUsed ? "used" : ""}`}
                        >
                          <span className="category-name">{category.name}</span>

                          <span className="category-score">
                            {isUsed ? `${score}点` : "未入力"}
                          </span>

                          {isCurrentPlayer && (
                            <button
                              className="edit-button"
                              onClick={() => handleSelectCategory(category.id)}
                            >
                              {isUsed ? "編集" : "入力"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="bonus-section">
                    <div>
                      <span>上段合計</span>
                      <strong>{upperScore}点</strong>
                    </div>

                    <div>
                      <span>ボーナス</span>
                      <strong>{bonusScore}点</strong>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </section>
      )}

      {selectedCategory && selectedCategoryData && currentPlayer && (
        <div className="modal-overlay">
          <div className="score-modal">
            <h2>{selectedCategoryData.name}</h2>

            <p>
              {getPlayerScore(currentPlayer, selectedCategory) !== null
                ? "得点を修正してください"
                : "今回の得点を入力してください"}
            </p>

            <input
              type="number"
              inputMode="numeric"
              min={selectedCategoryData.minScore}
              max={selectedCategoryData.maxScore}
              value={scoreInput}
              onChange={(event) => {
                setScoreInput(event.target.value);
                setErrorMessage("");
              }}
              autoFocus
            />

            <p className="score-range">
              入力可能範囲：{selectedCategoryData.minScore}〜
              {selectedCategoryData.maxScore}点
            </p>

            {errorMessage && <p className="error-message">{errorMessage}</p>}

            <div className="modal-actions">
              <button
                className="cancel-button"
                onClick={() => {
                  setSelectedCategory(null);
                  setScoreInput("");
                  setErrorMessage("");
                }}
                disabled={isSavingScore}
              >
                キャンセル
              </button>

              <button
                className="save-button"
                onClick={handleSaveScore}
                disabled={scoreInput === "" || isSavingScore}
              >
                {isSavingScore
                  ? "保存中..."
                  : getPlayerScore(currentPlayer, selectedCategory) !== null
                    ? "更新"
                    : "確定"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
