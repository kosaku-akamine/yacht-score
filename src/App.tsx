import { useEffect, useState } from "react";
import "./App.css";

type Category = {
  id: string;
  name: string;
  minScore: number;
  maxScore: number;
  fixedScore?: number;
};

type GameResponse = {
  gameCode: string;
  players: unknown;
};

type PlayerResponse = {
  id?: number;
  name: string;
};

type GameSession = {
  gameCode: string;
  playerName: string;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "https://yacht-score-production.up.railway.app";

const categories: Category[] = [
  {
    id: "aces",
    name: "エース",
    minScore: 0,
    maxScore: 5,
  },
  {
    id: "deuces",
    name: "デュース",
    minScore: 0,
    maxScore: 10,
  },
  {
    id: "threes",
    name: "トレイ",
    minScore: 0,
    maxScore: 15,
  },
  {
    id: "fours",
    name: "フォーズ",
    minScore: 0,
    maxScore: 20,
  },
  {
    id: "fives",
    name: "ファイブ",
    minScore: 0,
    maxScore: 25,
  },
  {
    id: "sixes",
    name: "シックス",
    minScore: 0,
    maxScore: 30,
  },
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
  {
    id: "yacht",
    name: "ヨット",
    minScore: 0,
    maxScore: 10000,
  },
  {
    id: "choice",
    name: "チョイス",
    minScore: 0,
    maxScore: 30,
  },
];

const createEmptyScores = (): Record<string, number | null> =>
  Object.fromEntries(
    categories.map((category) => [category.id, null]),
  ) as Record<string, number | null>;

const getScoreStorageKey = (session: GameSession) =>
  `yacht-scores-${session.gameCode}-${session.playerName}`;

const loadSession = (): GameSession | null => {
  const savedSession = localStorage.getItem("yacht-session");

  if (!savedSession) {
    return null;
  }

  try {
    return JSON.parse(savedSession) as GameSession;
  } catch {
    localStorage.removeItem("yacht-session");
    return null;
  }
};

const loadScores = (
  session: GameSession | null,
): Record<string, number | null> => {
  if (!session) {
    return createEmptyScores();
  }

  const savedScores = localStorage.getItem(getScoreStorageKey(session));

  if (!savedScores) {
    return createEmptyScores();
  }

  try {
    return JSON.parse(savedScores) as Record<string, number | null>;
  } catch {
    return createEmptyScores();
  }
};

function App() {
  const [session, setSession] = useState<GameSession | null>(() =>
    loadSession(),
  );

  const [scores, setScores] = useState<Record<string, number | null>>(() =>
    loadScores(loadSession()),
  );

  const [playerNameInput, setPlayerNameInput] = useState("");
  const [gameCodeInput, setGameCodeInput] = useState("");

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [scoreInput, setScoreInput] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [apiErrorMessage, setApiErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!session) {
      return;
    }

    localStorage.setItem("yacht-session", JSON.stringify(session));
    setScores(loadScores(session));
  }, [session]);

  const upperScore = categories
    .slice(0, 6)
    .reduce<number>((total, category) => {
      return total + (scores[category.id] ?? 0);
    }, 0);

  const bonusScore = upperScore >= 63 ? 35 : 0;

  const totalScore =
    Object.values(scores).reduce<number>((total, score) => {
      return total + (score ?? 0);
    }, 0) + bonusScore;

  const saveSession = (gameCode: string, playerName: string) => {
    const newSession: GameSession = {
      gameCode,
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
      `${API_BASE_URL}/api/games/${gameCode}/players`,
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

      const game = (await gameResponse.json()) as GameResponse;

      await createPlayer(game.gameCode, playerName);

      saveSession(game.gameCode, playerName);
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
      await createPlayer(gameCode, playerName);
      saveSession(gameCode, playerName);
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
    setScores(createEmptyScores());
    setPlayerNameInput("");
    setGameCodeInput("");
    setSelectedCategory(null);
    setScoreInput("");
    setErrorMessage("");
    setApiErrorMessage("");
  };

  const handleSelectCategory = (categoryId: string) => {
    const currentScore = scores[categoryId];

    setSelectedCategory(categoryId);

    if (currentScore !== null) {
      setScoreInput(String(currentScore));
    } else {
      setScoreInput("");
    }

    setErrorMessage("");
  };

  const handleSaveScore = () => {
    if (!selectedCategory || scoreInput === "") {
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

    const newScores = {
      ...scores,
      [selectedCategory]: score,
    };

    setScores(newScores);

    if (session) {
      localStorage.setItem(
        getScoreStorageKey(session),
        JSON.stringify(newScores),
      );
    }

    setSelectedCategory(null);
    setScoreInput("");
    setErrorMessage("");
  };

  const selectedCategoryData = categories.find(
    (category) => category.id === selectedCategory,
  );

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
          <span>プレイヤー</span>
          <strong>{session.playerName}</strong>
        </div>

        <button className="leave-button" onClick={handleLeaveGame}>
          退出
        </button>
      </section>

      <section className="score-summary">
        <p>合計得点</p>
        <strong>{totalScore}</strong>
        <span>点</span>
      </section>

      <section className="score-board">
        <h2>得点表</h2>

        <div className="score-list">
          {categories.map((category) => {
            const score = scores[category.id];
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

                <button
                  className="edit-button"
                  onClick={() => handleSelectCategory(category.id)}
                >
                  {isUsed ? "編集" : "入力"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bonus-section">
        <div>
          <span>上段合計</span>
          <strong>{upperScore}点</strong>
        </div>

        <div>
          <span>ボーナス</span>
          <strong>{bonusScore}点</strong>
        </div>
      </section>

      {selectedCategory && selectedCategoryData && (
        <div className="modal-overlay">
          <div className="score-modal">
            <h2>{selectedCategoryData.name}</h2>

            <p>
              {scores[selectedCategory] !== null
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
                  setErrorMessage("");
                }}
              >
                キャンセル
              </button>

              <button
                className="save-button"
                onClick={handleSaveScore}
                disabled={scoreInput === ""}
              >
                {scores[selectedCategory] !== null ? "更新" : "確定"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
