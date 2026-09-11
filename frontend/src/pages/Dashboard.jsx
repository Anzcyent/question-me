import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoadingOverlay from "../components/LoadingOverlay";
import { useToast } from "../components/Toast";

function Dashboard({ token, user }) {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleteModal, setDeleteModal] = useState({ open: false, pdfId: null, pdfName: "" });
  const [deleting, setDeleting] = useState(false);
  const [quizModal, setQuizModal] = useState({ open: false, pdfId: null, pdfName: "" });
  const [quizPrefs, setQuizPrefs] = useState({ difficulty: "orta", questionCount: 10, questionType: "multiple-choice", customPrompt: "" });
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    fetch("/api/pdf", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setPdfs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  const isBusy = uploading || generating;

  const pickFile = (f) => {
    if (isBusy) return;
    setFile(f);
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) pickFile(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) pickFile(f);
  };

  const uploadAndGenerate = () => {
    if (!file) {
      toast.error("Lütfen bir PDF dosyası seçin");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("pdf", file);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setUploadProgress(percent);
      }
    });

    xhr.addEventListener("load", async () => {
      try {
        const uploadData = JSON.parse(xhr.responseText);
        if (xhr.status !== 200 && xhr.status !== 201) {
          toast.error(uploadData.message || "Yükleme sırasında bir sorun oluştu.");
          setUploading(false);
          return;
        }

        setUploadProgress(100);

        const newPdf = {
          _id: uploadData.pdf.id,
          originalName: uploadData.pdf.originalName,
          createdAt: new Date().toISOString(),
        };
        setPdfs((prev) => [newPdf, ...prev]);

        setUploading(false);
        setFile(null);

        setQuizModal({ open: true, pdfId: uploadData.pdf.id, pdfName: uploadData.pdf.originalName });
      } catch (err) {
        toast.error("Yükleme sırasında bir sorun oluştu.");
        setUploading(false);
        setGenerating(false);
      }
    });

    xhr.addEventListener("error", () => {
      toast.error("Bağlantı hatası, lütfen tekrar deneyin.");
      setUploading(false);
      setGenerating(false);
    });

    xhr.open("POST", "/api/pdf/upload");
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.send(formData);
  };

  const createQuizForPdf = async (pdfId, prefs = {}) => {
    const res = await fetch(`/api/quiz/generate/${pdfId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(prefs),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message);
    }
    return data;
  };

  const handleCreateQuiz = async (pdfId) => {
    setQuizModal({ open: true, pdfId, pdfName: pdfs.find((p) => p._id === pdfId)?.originalName || "" });
  };

  const startQuizGeneration = async () => {
    const { pdfId } = quizModal;
    setQuizModal({ open: false, pdfId: null, pdfName: "" });
    setGenerating(true);
    try {
      const data = await createQuizForPdf(pdfId, quizPrefs);
      navigate(`/quiz/${data._id}`);
    } catch (err) {
      toast.error("Quiz oluşturulamadı, lütfen tekrar deneyin.");
      setGenerating(false);
    }
  };

  const handleDeletePdf = async () => {
    if (!deleteModal.pdfId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/pdf/${deleteModal.pdfId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Silme başarısız oldu.");
      }
      setPdfs(pdfs.filter((p) => p._id !== deleteModal.pdfId));
      setDeleteModal({ open: false, pdfId: null, pdfName: "" });
    } catch (err) {
      toast.error("Silme sırasında bir sorun oluştu.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="loading">Yükleniyor...</div>;

  return (
    <div className="db-page">
      <div className="db-aura" aria-hidden="true" />

      <div className="db-header anim-fade-up anim-delay-1">
        <span className="db-badge">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
          </svg>
          AI Destekli Quiz Oluşturucu
        </span>
        <h1 className="db-greeting">
          Merhaba, <span className="db-greeting-name">{user?.name || "hoş geldin"}</span>
        </h1>
        <p className="db-greeting-sub">Bir PDF yükle, yapay zeka içerikten quiz hazırlasın.</p>
      </div>

      <div className="db-upload anim-fade-up anim-delay-2">
        <div
          className={`db-dropzone ${dragging ? "db-dropzone-drag" : ""} ${file ? "db-dropzone-file" : ""} ${isBusy ? "db-dropzone-disabled" : ""}`}
          onClick={() => !isBusy && document.getElementById("db-pdf-input").click()}
          onDragOver={(e) => { if (!isBusy) { e.preventDefault(); setDragging(true); } }}
          onDragEnter={(e) => { if (!isBusy) { e.preventDefault(); setDragging(true); } }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { if (!isBusy) handleDrop(e); }}
        >
          <div className="db-dropzone-icon">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
              <path d="M12 22v-9" />
              <path d="m8 17 4-4 4 4" />
            </svg>
          </div>
          <h3 className="db-dropzone-title">{file ? file.name : "PDF dosyasını sürükle ve bırak"}</h3>
          <p className="db-dropzone-sub">
            {file ? `${(file.size / 1024 / 1024).toFixed(1)} MB - tekrar seçmek için tıkla` : "veya tıkla, dosya seç"}
          </p>
          <span className="db-dropzone-hint">Maksimum 10MB · PDF</span>
          <input id="db-pdf-input" type="file" accept=".pdf" onChange={handleFileChange} style={{ display: "none" }} />
        </div>

        {(file || uploading || generating) && (
          <button
            className="db-upload-btn"
            onClick={uploadAndGenerate}
            disabled={uploading || generating}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {uploading ? "Yükleniyor..." : "Yükle ve Quiz Oluştur"}
          </button>
        )}
      </div>

      <div className="db-list anim-fade-up anim-delay-3">
        {pdfs.length === 0 ? (
          <div className="db-empty">
            <div className="db-empty-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <p className="db-empty-title">Henüz PDF yüklenmemiş</p>
            <p className="db-empty-sub">Yukarıdan ilk PDF'ini yükle.</p>
          </div>
        ) : (
          <>
            <h3 className="db-list-title">PDF'lerim</h3>
            <div className="db-pdfs">
              {pdfs.map((pdf) => (
                <div key={pdf._id} className="db-pdf-item">
                  <div className="db-pdf-icon">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div className="db-pdf-info">
                    <h4>{pdf.originalName}</h4>
                    <p>{new Date(pdf.createdAt).toLocaleDateString("tr-TR")}</p>
                  </div>
                  <div className="db-pdf-actions">
                    <button className="db-pdf-quiz-btn" onClick={() => handleCreateQuiz(pdf._id)} disabled={generating}>
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
                      </svg>
                      {generating ? "..." : "Quiz Oluştur"}
                    </button>
                    <button className="db-pdf-del-btn" onClick={() => setDeleteModal({ open: true, pdfId: pdf._id, pdfName: pdf.originalName })} disabled={generating} title="Sil">
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {deleteModal.open && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteModal({ open: false, pdfId: null, pdfName: "" })}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">PDF'i Sil</div>
            <div className="modal-desc"><strong>{deleteModal.pdfName}</strong> ve ilişkili tüm quiz'ler silinecek. Emin misiniz?</div>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-cancel" onClick={() => setDeleteModal({ open: false, pdfId: null, pdfName: "" })} disabled={deleting}>İptal</button>
              <button className="modal-btn modal-btn-danger" onClick={handleDeletePdf} disabled={deleting}>Sil</button>
            </div>
          </div>
        </div>
      )}

      {quizModal.open && (
        <div className="modal-overlay" onClick={() => !generating && setQuizModal({ open: false, pdfId: null, pdfName: "" })}>
          <div className="modal-card quiz-prefs-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Quiz Oluştur</div>
            <div className="modal-desc"><strong>{quizModal.pdfName}</strong> için quiz ayarlarını seçin.</div>

            <div className="quiz-prefs-form">
              <div className="pref-group">
                <label className="pref-label">Zorluk Seviyesi</label>
                <div className="pref-options">
                  {[{ value: "kolay", label: "Kolay" }, { value: "orta", label: "Orta" }, { value: "zor", label: "Zor" }, { value: "karışık", label: "Karışık" }].map((d) => (
                    <button key={d.value} className={`pref-btn ${quizPrefs.difficulty === d.value ? "active" : ""}`} onClick={() => setQuizPrefs({ ...quizPrefs, difficulty: d.value })}>{d.label}</button>
                  ))}
                </div>
              </div>
              <div className="pref-group">
                <label className="pref-label">Soru Sayısı</label>
                <div className="pref-options">
                  {[5, 10, 15, 20].map((n) => (
                    <button key={n} className={`pref-btn ${quizPrefs.questionCount === n ? "active" : ""}`} onClick={() => setQuizPrefs({ ...quizPrefs, questionCount: n })}>{n}</button>
                  ))}
                </div>
              </div>
              <div className="pref-group">
                <label className="pref-label">Soru Tipi</label>
                <div className="pref-options">
                  {[{ value: "multiple-choice", label: "Çoktan Seçmeli" }, { value: "written", label: "Yazılı Cevap" }, { value: "mixed", label: "Karışık" }].map((t) => (
                    <button key={t.value} className={`pref-btn ${quizPrefs.questionType === t.value ? "active" : ""}`} onClick={() => setQuizPrefs({ ...quizPrefs, questionType: t.value })}>{t.label}</button>
                  ))}
                </div>
              </div>
              <div className="pref-group">
                <label className="pref-label">Özel İsteğiniz (isteğe bağlı)</label>
                <textarea className="pref-textarea" placeholder="Örn: Sadece fiillere odaklan, cümle bazlı sorular sor,..." value={quizPrefs.customPrompt} onChange={(e) => setQuizPrefs({ ...quizPrefs, customPrompt: e.target.value })} rows={3} />
              </div>
            </div>

            <div className="modal-actions">
              <button className="modal-btn modal-btn-cancel" onClick={() => setQuizModal({ open: false, pdfId: null, pdfName: "" })} disabled={generating}>İptal</button>
              <button className="modal-btn modal-btn-primary" onClick={startQuizGeneration} disabled={generating}>
                {generating ? "Oluşturuluyor..." : "Quiz Oluştur"}
              </button>
            </div>
          </div>
        </div>
      )}

      {(uploading || generating) && <LoadingOverlay type={uploading ? "uploading" : "generating"} progress={uploading ? uploadProgress : undefined} />}
      {deleting && <LoadingOverlay type="deleting" />}
    </div>
  );
}

export default Dashboard;
