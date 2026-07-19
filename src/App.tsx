import { useState } from "react";
import "./App.css";

type Category = {
  id: string;
  name: string;
  minScore: number;
  maxScore: number;
  fixedScore?: number;
};

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
    name: "B.ストレート",
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

function App() {
  const [scores, setScores] = useState<Record<string, number | null>>(() => {
    const savedScores = localStorage.getItem("yacht-scores");

    return savedScores
      ? JSON.parse(savedScores)
      : Object.fromEntries(categories.map((category) => [category.id, null]));
  });

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [scoreInput, setScoreInput] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

  const upperScore = categories
    .slice(0, 6)
    .reduce<number>((total, category) => total + (scores[category.id] ?? 0), 0);

  const bonusScore = upperScore >= 63 ? 35 : 0;

  const totalScore =
    Object.values(scores).reduce<number>(
      (total, score) => total + (score ?? 0),
      0,
    ) + bonusScore;

  const handleSelectCategory = (categoryId: string) => {
    const currentScore = scores[categoryId];

    setSelectedCategory(categoryId);

    // 編集の場合は、現在の得点を入力欄に表示
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

    const category = categories.find(
      (category) => category.id === selectedCategory,
    );

    if (!category) return;

    const score = Number(scoreInput);

    // 数値でない場合
    if (Number.isNaN(score)) {
      setErrorMessage("数字を入力してください");
      return;
    }

    // 整数でない場合
    if (!Number.isInteger(score)) {
      setErrorMessage("整数を入力してください");
      return;
    }

    // 最小値・最大値チェック
    if (score < category.minScore || score > category.maxScore) {
      setErrorMessage(
        `${category.name}は${category.minScore}〜${category.maxScore}点で入力してください`,
      );
      return;
    }

    // 固定得点の役のチェック
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

    localStorage.setItem("yacht-scores", JSON.stringify(newScores));

    setSelectedCategory(null);
    setScoreInput("");
    setErrorMessage("");
  };

  const handleReset = () => {
    if (!window.confirm("得点をすべてリセットしますか？")) return;

    const resetScores = Object.fromEntries(
      categories.map((category) => [category.id, null]),
    );

    setScores(resetScores);

    localStorage.removeItem("yacht-scores");
  };

  const selectedCategoryName = categories.find(
    (category) => category.id === selectedCategory,
  )?.name;

  const selectedCategoryData = categories.find(
    (category) => category.id === selectedCategory,
  );

  return (
    <main className="app">
      <header className="header">
        <div>
          <p className="subtitle">YACHT SCORE BOARD</p>
          <h1>ヨット</h1>
        </div>

        <button className="reset-button" onClick={handleReset}>
          リセット
        </button>
      </header>

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
          <strong>{bonusScore}</strong>
        </div>
      </section>

      {selectedCategory && (
        <div className="modal-overlay">
          <div className="score-modal">
            <h2>{selectedCategoryName}</h2>

            <p>
              {scores[selectedCategory] !== null
                ? "得点を修正してください"
                : "今回の得点を入力してください"}
            </p>

            <input
              type="number"
              inputMode="numeric"
              min={selectedCategoryData?.minScore}
              max={selectedCategoryData?.maxScore}
              value={scoreInput}
              onChange={(event) => {
                setScoreInput(event.target.value);
                setErrorMessage("");
              }}
              autoFocus
            />

            {selectedCategoryData && (
              <p className="score-range">
                入力可能範囲：
                {selectedCategoryData.minScore}〜{selectedCategoryData.maxScore}
                点
              </p>
            )}

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
