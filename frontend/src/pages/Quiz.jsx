import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";
import LoadingOverlay from "../components/LoadingOverlay";

function Quiz({ token }) {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, message: "" });

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

  const handleAnswer = (questionIndex, optionIndex) => {
    setAnswers({ ...answers, [questionIndex]: optionIndex });
  };

  const handleWrittenAnswer = (questionIndex, text) => {
    setAnswers({ ...answers, [questionIndex]: text });
  };

  const handleSkip = () => {
    const newAnswers = { ...answers };
    delete newAnswers[currentQuestion];
    setAnswers(newAnswers);
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleSubmit = async () => {
    const answeredCount = Object.keys(answers).filter((key) => {
      const val = answers[key];
      return val !== undefined && val !== "" && val !== -1;
    }).length;
    const total = quiz.questions.length;

    if (answeredCount === 0) {
      toast.error("En az bir soruya cevap vermelisiniz!");
      return;
    }

    const message = total === answeredCount
      ? `Tüm ${total} soruya cevap verdiniz. Göndermek istediğinize emin misiniz?`
      : `Toplam ${total} sorudan ${answeredCount}'ına cevap verdiniz. ${total - answeredCount} soru boş bırakılacak. Göndermek istediğinize emin misiniz?`;
    setConfirmModal({ open: true, message });
  };

  const handleConfirmSubmit = async () => {
    setConfirmModal({ open: false, message: "" });
    setSubmitting(true);
    try {
      const res = await fetch(`/api/quiz/${quizId}/submit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Quiz gönderilirken hata oluştu");
        return;
      }

      navigate(`/quiz-result/${quizId}`);
    } catch (err) {
      toast.error("Bir hata oluştu: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading">Quiz yükleniyor...</div>;
  if (!quiz) return <div className="loading">Quiz bulunamadı</div>;

  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
  const answeredCount = Object.keys(answers).filter((key) => {
    const val = answers[key];
    return val !== undefined && val !== "" && val !== -1;
  }).length;

  return (
    <div className="quiz-page">
      <div className="quiz-top">
        <div className="quiz-progress-bar-wrap">
          <div className="quiz-progress-label">
            <span>Soru {currentQuestion + 1} / {quiz.questions.length}</span>
            <span>{answeredCount} cevaplandı</span>
          </div>
          <div className="quiz-progress-track">
            <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="quiz-card">
        <div className="quiz-card-header">
          <span className="quiz-q-num">{currentQuestion + 1}</span>
          <span className="quiz-q-type">{question.questionType === "written" ? "Yazılı" : "Çoktan Seçmeli"}</span>
        </div>
        <p className="quiz-q-text">{question.question}</p>

        {question.questionType === "written" ? (
          <div className="quiz-written-area">
            <textarea
              className="quiz-written-input"
              placeholder="Cevabınızı yazın..."
              value={answers[currentQuestion] !== undefined ? answers[currentQuestion] : ""}
              onChange={(e) => handleWrittenAnswer(currentQuestion, e.target.value)}
              rows={4}
            />
          </div>
        ) : (
          <div className="quiz-options">
            {question.options.map((option, i) => (
              <button
                key={i}
                className={`quiz-opt ${answers[currentQuestion] === i ? "quiz-opt-selected" : ""}`}
                onClick={() => handleAnswer(currentQuestion, i)}
              >
                <span className="quiz-opt-letter">{String.fromCharCode(65 + i)}</span>
                <span className="quiz-opt-text">{option}</span>
              </button>
            ))}
          </div>
        )}

        <button className="quiz-skip-btn" onClick={handleSkip}>
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
          </svg>
          Boş Bırak
        </button>
      </div>

      <div className="quiz-nav">
        <button
          className="quiz-nav-btn"
          onClick={() => setCurrentQuestion(currentQuestion - 1)}
          disabled={currentQuestion === 0}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Önceki
        </button>

        <div className="quiz-dots">
          {quiz.questions.map((_, i) => {
            const val = answers[i];
            const isAnswered = val !== undefined && val !== "" && val !== -1;
            return (
              <button
                key={i}
                onClick={() => setCurrentQuestion(i)}
                className={`quiz-dot ${isAnswered ? "quiz-dot-answered" : ""} ${currentQuestion === i ? "quiz-dot-active" : ""}`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {currentQuestion === quiz.questions.length - 1 ? (
          <button className="quiz-nav-btn quiz-nav-submit" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Gönderiliyor..." : "Bitir"}
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </button>
        ) : (
          <button className="quiz-nav-btn" onClick={() => setCurrentQuestion(currentQuestion + 1)}>
            Sonraki
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        )}
      </div>

      {confirmModal.open && (
        <div className="modal-overlay" onClick={() => setConfirmModal({ open: false, message: "" })}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Quiz'i Gönder</div>
            <div className="modal-desc">{confirmModal.message}</div>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-cancel" onClick={() => setConfirmModal({ open: false, message: "" })} disabled={submitting}>
                İptal
              </button>
              <button className="modal-btn modal-btn-primary" onClick={handleConfirmSubmit} disabled={submitting}>
                {submitting ? "Gönderiliyor..." : "Gönder"}
              </button>
            </div>
          </div>
        </div>
      )}

      {submitting && <LoadingOverlay type="submitting" />}
    </div>
  );
}

export default Quiz;
