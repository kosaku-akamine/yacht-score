import { useState } from "react";
import "./App.css";

type Category = {
  id: string;
  name: string;
};

const categories: Category[] = [
  { id: "aces", name: "エース" },
  { id: "deuces", name: "デュース" },
  { id: "threes", name: "トレイ" },
  { id: "fours", name: "フォーズ" },
  { id: "fives", name: "ファイブ" },
  { id: "sixes", name: "シックス" },
  { id: "four-of-a-kind", name: "フォーダイス" },
  { id: "full-house", name: "フルハウス" },
  { id: "small-straight", name: "S.ストレート" },
  { id: "large-straight", name: "B.ストレート" },
  { id: "yacht", name: "ヨット" },
  { id: "choice", name: "チョイス" },
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

  const totalScore = Object.values(scores).reduce(
    (total, score) => total + (score ?? 0),
    0,
  );

  const upperScore = categories
    .slice(0, 6)
    .reduce((total, category) => total + (scores[category.id] ?? 0), 0);

  const handleSelectCategory = (categoryId: string) => {
    if (scores[categoryId] !== null) return;

    setSelectedCategory(categoryId);
    setScoreInput("");
  };

  const handleSaveScore = () => {
    if (!selectedCategory || scoreInput === "") return;

    const score = Number(scoreInput);

    if (Number.isNaN(score) || score < 0) return;

    const newScores = {
      ...scores,
      [selectedCategory]: score,
    };

    setScores(newScores);
    localStorage.setItem("yacht-scores", JSON.stringify(newScores));

    setSelectedCategory(null);
    setScoreInput("");
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
              <button
                key={category.id}
                className={`score-row ${isUsed ? "used" : ""}`}
                onClick={() => handleSelectCategory(category.id)}
                disabled={isUsed}
              >
                <span className="category-name">{category.name}</span>

                <span className="category-score">
                  {isUsed ? `${score}点` : "未入力"}
                </span>
              </button>
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
          <strong>{upperScore >= 63 ? "35点" : "0点"}</strong>
        </div>
      </section>

      {selectedCategory && (
        <div className="modal-overlay">
          <div className="score-modal">
            <h2>{selectedCategoryName}</h2>
            <p>今回の得点を入力してください</p>

            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={scoreInput}
              onChange={(event) => setScoreInput(event.target.value)}
              autoFocus
            />

            <div className="modal-actions">
              <button
                className="cancel-button"
                onClick={() => setSelectedCategory(null)}
              >
                キャンセル
              </button>

              <button
                className="save-button"
                onClick={handleSaveScore}
                disabled={scoreInput === ""}
              >
                確定
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
