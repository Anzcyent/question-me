import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

function QuizResult({ token }) {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/quiz/${quizId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setQuiz(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [quizId, token]);

  if (loading) return <div className="loading">Yükleniyor...</div>;
  if (!quiz) return <div className="loading">Quiz bulunamadı</div>;

  const answeredCount = quiz.answeredCount || quiz.userAnswers.filter((a) => a >= 0 || (typeof a === "string" && a.trim() !== "")).length;
  const skippedCount = quiz.totalQuestions - answeredCount;
  const wrongCount = answeredCount - quiz.score;
  const percentage = answeredCount > 0 ? Math.round((quiz.score / answeredCount) * 100) : 0;

  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="result-page">
      <div className="result-header anim-fade-up anim-delay-1">
        <div className="result-score-ring">
          <svg viewBox="0 0 120 120" className="result-ring-svg">
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(13,148,136,0.12)" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="52" fill="none"
              stroke="url(#scoreGrad)" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 60 60)"
              className="result-ring-progress"
            />
            <defs>
              <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14b8a6" />
                <stop offset="100%" stopColor="#2dd4bf" />
              </linearGradient>
            </defs>
          </svg>
          <div className="result-score-text">
            <span className="result-score-num">{quiz.score}</span>
            <span className="result-score-sep">/</span>
            <span className="result-score-total">{answeredCount}</span>
          </div>
        </div>

        <h2 className="result-title">
          {percentage >= 80 ? "Harika!" : percentage >= 50 ? "İyi!" : "Daha çok çalışmalısın!"}
        </h2>
        <p className="result-subtitle">%{percentage} doğru cevap</p>

        <div className="result-stats">
          <div className="result-stat result-stat-good">
            <span className="result-stat-num">{quiz.score}</span>
            <span className="result-stat-label">Doğru</span>
          </div>
          <div className="result-stat result-stat-bad">
            <span className="result-stat-num">{wrongCount}</span>
            <span className="result-stat-label">Yanlış</span>
          </div>
          <div className="result-stat result-stat-skip">
            <span className="result-stat-num">{skippedCount}</span>
            <span className="result-stat-label">Boş</span>
          </div>
        </div>
      </div>

      <div className="result-questions anim-fade-up anim-delay-2">
        <h3 className="result-section-title">Sorular ve Cevaplar</h3>
        {quiz.questions.map((q, i) => {
          const userAnswer = quiz.userAnswers[i];
          const isWritten = q.questionType === "written";

          if (isWritten) {
            const userText = userAnswer || "";
            const isSkipped = userText.trim() === "";
            const aiResult = quiz.writtenResults ? quiz.writtenResults[i] : null;
            const isCorrect = aiResult === "correct";

            const statusClass = isSkipped ? "rq-skipped" : isCorrect ? "rq-correct" : "rq-wrong";
            return (
              <div key={i} className={`rq-card ${statusClass}`}>
                <div className="rq-header">
                  <span className="rq-num">{i + 1}</span>
                  <span className={`rq-badge ${statusClass}`}>
                    {isSkipped ? "Boş" : isCorrect ? "Doğru" : "Yanlış"}
                  </span>
                </div>
                <p className="rq-question">{q.question}</p>
                {isSkipped ? (
                  <p className="rq-answer rq-empty">Cevap verilmedi</p>
                ) : (
                  <p className={`rq-answer ${isCorrect ? "rq-ans-correct" : "rq-ans-wrong"}`}>
                    Senin cevabın: <strong>{userAnswer}</strong>
                  </p>
                )}
                {!isSkipped && !isCorrect && (
                  <p className="rq-answer rq-ans-expected">Doğru cevap: <strong>{q.correctAnswerText}</strong></p>
                )}
                {isSkipped && (
                  <p className="rq-answer rq-ans-expected">Doğru cevap: <strong>{q.correctAnswerText}</strong></p>
                )}
              </div>
            );
          }

          const isSkipped = userAnswer === -1 || userAnswer === undefined;
          const isCorrect = userAnswer === q.correctAnswer;
          const statusClass = isSkipped ? "rq-skipped" : isCorrect ? "rq-correct" : "rq-wrong";

          return (
            <div key={i} className={`rq-card ${statusClass}`}>
              <div className="rq-header">
                <span className="rq-num">{i + 1}</span>
                <span className={`rq-badge ${statusClass}`}>
                  {isSkipped ? "Boş" : isCorrect ? "Doğru" : "Yanlış"}
                </span>
              </div>
              <p className="rq-question">{q.question}</p>
              {isSkipped ? (
                <p className="rq-answer rq-empty">Cevap verilmedi</p>
              ) : (
                <p className={`rq-answer ${isCorrect ? "rq-ans-correct" : "rq-ans-wrong"}`}>
                  Senin cevabın: <strong>{q.options[userAnswer]}</strong>
                </p>
              )}
              {!isSkipped && !isCorrect && (
                <p className="rq-answer rq-ans-expected">Doğru cevap: <strong>{q.options[q.correctAnswer]}</strong></p>
              )}
              {isSkipped && (
                <p className="rq-answer rq-ans-expected">Doğru cevap: <strong>{q.options[q.correctAnswer]}</strong></p>
              )}
            </div>
          );
        })}
      </div>

      <div className="result-actions anim-fade-up anim-delay-3">
        <button className="result-btn result-btn-primary" onClick={() => navigate(`/quiz/${quizId}`)}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
          Tekrar Dene
        </button>
        <Link to="/" className="result-btn result-btn-secondary">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Yeni Quiz Yükle
        </Link>
        <Link to="/my-quizzes" className="result-btn result-btn-ghost">
          Quizlerim
        </Link>
      </div>
    </div>
  );
}

export default QuizResult;
