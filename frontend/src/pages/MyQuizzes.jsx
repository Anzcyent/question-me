import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import LoadingOverlay from "../components/LoadingOverlay";
import { useToast } from "../components/Toast";

function MyQuizzes({ token }) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ open: false, quizId: null, quizName: "" });
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    fetch("/api/quiz", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setQuizzes(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  const handleDeleteQuiz = async () => {
    if (!deleteModal.quizId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/quiz/${deleteModal.quizId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Silme başarısız oldu.");
      }
      setQuizzes(quizzes.filter((q) => q._id !== deleteModal.quizId));
      setDeleteModal({ open: false, quizId: null, quizName: "" });
    } catch (err) {
      toast.error("Silme sırasında bir sorun oluştu.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="loading">Yükleniyor...</div>;

  return (
    <div className="myquizzes-page">
      <div className="db-aura" aria-hidden="true" />

      <div className="db-header anim-fade-up anim-delay-1">
        <h1 className="db-greeting">Quizlerim</h1>
        <p className="db-greeting-sub">Tüm quiz sonuçların burada.</p>
      </div>

      {quizzes.length === 0 ? (
        <div className="empty-card-wrap anim-fade-up anim-delay-2">
          <div className="empty-card">
            <div className="empty-card-icon">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>
            <h3 className="empty-card-title">Henüz Oluşturulmuş Quiz Yok</h3>
            <p className="empty-card-desc">
              İlk PDF'ini yükleyerek yapay zeka ile quizini saniyeler içinde hazırlayabilirsin.
            </p>
            <button
              className="btn-empty-action"
              onClick={() => navigate("/")}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              PDF Yükle
            </button>
          </div>
        </div>
      ) : (
        <div className="quiz-list anim-fade-up anim-delay-2">
          {quizzes.map((quiz) => {
            const answered = quiz.answeredCount || quiz.totalQuestions;
            const percentage = quiz.completed
              ? Math.round((quiz.score / answered) * 100)
              : 0;
            return (
              <div key={quiz._id} className="quiz-history-item">
                <div>
                  <h4>{quiz.pdf?.originalName || "PDF"}</h4>
                  <p style={{ color: "#64748b", fontSize: "0.85rem" }}>
                    {new Date(quiz.createdAt).toLocaleDateString("tr-TR")} • {quiz.totalQuestions} soru
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  {quiz.completed ? (
                    <span
                      className={`score-badge ${
                        percentage >= 70 ? "good" : percentage >= 40 ? "medium" : "bad"
                      }`}
                    >
                      %{percentage} • {quiz.score}/{answered}
                    </span>
                  ) : (
                    <span className="score-badge medium">Tamamlanmadı</span>
                  )}
                  <Link
                    to={quiz.completed ? `/quiz-result/${quiz._id}` : `/quiz/${quiz._id}`}
                    className="btn btn-primary-glow"
                    style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}
                  >
                    {quiz.completed ? "Sonuç" : "Devam Et"}
                  </Link>
                  <button
                    className="db-pdf-del-btn"
                    onClick={() => setDeleteModal({ open: true, quizId: quiz._id, quizName: quiz.pdf?.originalName || "Quiz" })}
                    title="Quiz'i Sil"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deleteModal.open && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteModal({ open: false, quizId: null, quizName: "" })}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Quiz'i Sil</div>
            <div className="modal-desc">
              <strong>{deleteModal.quizName}</strong> silinecek. Emin misiniz?
            </div>
            <div className="modal-actions">
              <button
                className="modal-btn modal-btn-cancel"
                onClick={() => setDeleteModal({ open: false, quizId: null, quizName: "" })}
                disabled={deleting}
              >
                İptal
              </button>
              <button
                className="modal-btn modal-btn-danger"
                onClick={handleDeleteQuiz}
                disabled={deleting}
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {deleting && <LoadingOverlay type="deleting" />}
    </div>
  );
}

export default MyQuizzes;
