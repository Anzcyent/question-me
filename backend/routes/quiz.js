const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const auth = require("../middleware/auth");
const Pdf = require("../models/Pdf");
const Quiz = require("../models/Quiz");

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const models = ["gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash"];

function getModel(name) {
  return genAI.getGenerativeModel({
    model: name,
    generationConfig: {
      temperature: 0.8,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 8000,
      responseMimeType: "application/json",
    },
  });
}

function getRandomSeed() {
  return Math.floor(Math.random() * 1000000);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function validateQuestions(questions) {
  if (!Array.isArray(questions)) return [];

  return questions.filter((q, i) => {
    if (!q || typeof q !== "object") return false;
    if (!q.question || typeof q.question !== "string" || q.question.trim().length < 5) return false;

    if (q.questionType === "multiple-choice") {
      if (!Array.isArray(q.options) || q.options.length !== 4) return false;
      const uniqueOptions = new Set(q.options.map((o) => String(o).trim().toLowerCase()));
      if (uniqueOptions.size < 4) return false;
      if (typeof q.correctAnswer !== "number" || q.correctAnswer < 0 || q.correctAnswer > 3) return false;
    } else if (q.questionType === "written") {
      if (!q.correctAnswerText || typeof q.correctAnswerText !== "string" || q.correctAnswerText.trim().length < 2) return false;
    }

    return true;
  });
}

async function generateWithRetry(prompt, maxRetries = 2) {
  let lastError;
  for (const modelName of models) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`Model deneniyor: ${modelName} (deneme ${attempt + 1})`);
        const m = getModel(modelName);
        const result = await m.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log(`Model ${modelName} başarılı`);
        return text;
      } catch (err) {
        lastError = err;
        console.log(`Model ${modelName} başarısız: ${err.message}`);
        if (attempt < maxRetries - 1) {
          await sleep(1000 * (attempt + 1));
        }
      }
    }
  }
  throw lastError;
}

router.post("/generate/:pdfId", auth, async (req, res) => {
  try {
    console.log("Quiz oluşturma isteği geldi, pdfId:", req.params.pdfId);
    console.log("Request body:", JSON.stringify(req.body));

    const pdf = await Pdf.findOne({ _id: req.params.pdfId, user: req.user.userId });
    if (!pdf) {
      console.log("PDF bulunamadı");
      return res.status(404).json({ message: "PDF bulunamadı" });
    }

    console.log("PDF bulundu, text uzunluğu:", pdf.text.length);

    const { difficulty, questionCount, customPrompt, questionType } = req.body || {};
    const truncatedText = pdf.text.substring(0, 10000);
    const qType = ["multiple-choice", "written", "mixed"].includes(questionType) ? questionType : "multiple-choice";

    let difficultyText = "";
    if (difficulty === "kolay") difficultyText = "Sorular kolay ve temel bilgiye dayalı olsun.";
    else if (difficulty === "orta") difficultyText = "Sorular orta düzeyde olsun, biraz düşünmeyi gerektirsin.";
    else if (difficulty === "zor") difficultyText = "Sorular zor ve analitik düşünme gerektirsin.";
    else if (difficulty === "karışık") difficultyText = "Soruların zorluk seviyesi karışık olsun. Kimisi kolay, kimisi orta, kimisi zor olsun. Her seviyeden soru karışık şekilde gelsin.";

    const count = Math.min(Math.max(parseInt(questionCount) || 10, 3), 20);
    const uniqueId = getRandomSeed();

    const randomInstructions = [
      "Tamamen farklı bir açıdan sorular oluştur.",
      "Metindeki bilgileri farklı şekillerde sorgula.",
      "Beklenmedik soru tipleri kullan.",
      "Yaratıcı ve farklı sorular oluştur.",
      "Sıradışı soru formatları dene.",
    ];
    const randomInstruction = randomInstructions[Math.floor(Math.random() * randomInstructions.length)];

    let typeInstructions = "";
    let formatExample = "";

    if (qType === "multiple-choice") {
      typeInstructions = `Tüm sorular çoktan seçmeli olmalı. Her sorunun 4 seçeneği olmalı ve doğru cevap belirtilmeli.`;
      formatExample = `[{"questionType":"multiple-choice","question":"soru1","options":["A","B","C","D"],"correctAnswer":0},{"questionType":"multiple-choice","question":"soru2","options":["A","B","C","D"],"correctAnswer":2}]`;
    } else if (qType === "written") {
      typeInstructions = `Tüm sorular yazılı cevap gerektirmeli. "options" alanı boş [] olmalı, "correctAnswer" null olmalı, "correctAnswerText" alanına doğru cevabı yaz.`;
      formatExample = `[{"questionType":"written","question":"soru1","options":[],"correctAnswer":null,"correctAnswerText":"cevap1"},{"questionType":"written","question":"soru2","options":[],"correctAnswer":null,"correctAnswerText":"cevap2"}]`;
    } else {
      typeInstructions = `Soruların yarısı çoktan seçmeli, yarısı yazılı cevap gerektirmeli. Karışık dağıt. Çoktan seçmelilerde 4 seçenek ve doğru cevap indeksi, yazılılarda "correctAnswerText" ve "options" [] olmalı.`;
      formatExample = `[{"questionType":"multiple-choice","question":"soru1","options":["A","B","C","D"],"correctAnswer":0},{"questionType":"written","question":"soru2","options":[],"correctAnswer":null,"correctAnswerText":"cevap2"}]`;
    }

    const prompt = `Sen profesyonel bir eğitim içeriği uzmanısın. Aşağıdaki metinden yüksek kaliteli quiz soruları oluştur.

BENZERSIZ QUIZ #${uniqueId}

=====================================
KALİTE STANDARTLARI (EN ÖNEMLİ KURAL):
=====================================
- Her soru SADECE verilen metne dayanmalıdır. Metinde olmayan bilgileri soru olarak KULLANMA.
- Seçenekler birbirine yakın olmalı. "Hepsini biliyorum" veya "Hiçbiri" gibi bariz yanlış seçenekler EKLEME.
- Doğru cevap, metne göre kesinlikle tartışmasız olmalı.
- Her soru net ve anlaşılır olmalı, çift anlamlı ifadelerden kaçın.
- Sadece metinde açıkça belirtilen veya güçlü bir şekilde ima edilen bilgileri sor.
- Soruları basit tekrardan (doldurma, listeleme) ziyade ANLAMA ve UYGULAMA düzeyinde oluştur.

=====================================
SORU SAYISI VE FORMAT:
=====================================
- Tam olarak ${count} soru oluştur. Eksik veya fazla olmamalı.
- ${typeInstructions}
- Sadece JSON jsonArray formatında yanıt ver.
- Format örneği: ${formatExample}

=====================================
ZORLUK SEVİYESİ:
=====================================
${difficultyText}

=====================================
ÇEŞİTLİLİK KURALLARI:
=====================================
- ${randomInstruction}
- Aynı bilgiyi farklı açılardan sorgula. Örneğin: bir soru "nedir?" diye soruyorsa, diğeri "neden önemlidir?" veya "nasıl çalışır?" gibi farklı bir açıdan sorsun.
- Soru kalıplarını tekrarlama. Her soru kendine özgü bir yapıya sahip olmalı.
- Tüm konuları kapsa, sadece kolay veya sadece zor bölümlere odaklanma.

DİL ÖĞRENİMİ / VOCABULARY KURALLARI:
Eğer metin dil öğrenimi veya vocabulary/kelime odaklıysa:
- Soruları karışık sırayla oluştur (metindeki sırayı takip etme).
- FARKLI HARFLERLE BAŞLAMAN KELİMELERİ SEÇ. Aynı harfle başlayan kelimeleri üst üste kullanma.
- Her soruda farklı bir harf grubundan kelime seçmeye çalış.
- Metindeki kelimeleri alfabetik sıraya koyma, tamamen rastgele dağıt.

${customPrompt ? `
====================================
KULLANICININ ÖZEL İSTEKLERİ:
Bu istekleri TÜM diğer kurallardan DAHA ÖNCELİKLİ tut ve MUTLAKA uygula:
${customPrompt}
====================================
` : ""}

METİN İÇERİĞİ:
${truncatedText}

=====================================
SON KONTROL LİSTESİ (cevaplamadan önce kontrol et):
=====================================
1. Toplam ${count} soru mu var?
2. Her soru metne dayanıyor mu?
3. Seçenekler birbirine yakın mı?
4. Doğru cevap tartışmasız mı?
5. Sorular birbirinden farklı mı?
6. JSON formatı doğru mu?

${count} SORU OLUŞTUR.`;

    console.log("Prompt uzunluğu:", prompt.length);
    console.log("Custom prompt:", customPrompt);

    const responseContent = await generateWithRetry(prompt);
    console.log("API yanıtı alındı, uzunluk:", responseContent.length);

    let cleanedContent = responseContent.replace(/```json|```/g, "").trim();

    const jsonMatch = cleanedContent.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      cleanedContent = jsonMatch[0];
    }

    let questions;
    try {
      questions = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.log("JSON parse hatası, düzeltilmeye çalışılıyor...");

      let fixed = cleanedContent;

      const lastComplete = fixed.lastIndexOf("},");
      if (lastComplete > 0) {
        fixed = fixed.substring(0, lastComplete + 1) + "]";
      }

      try {
        questions = JSON.parse(fixed);
        console.log("JSON başarıyla düzeltildi, soru sayısı:", questions.length);
      } catch (e) {
        console.log("JSON düzeltilemedi:", fixed.substring(0, 300));
        throw new Error("Yanıt geçerli JSON formatında değil.");
      }
    }
    console.log("Quiz oluşturuldu, soru sayısı:", questions.length);

    questions = validateQuestions(questions);
    console.log("Doğrulama sonrası soru sayısı:", questions.length);

    const seenQuestions = new Set();
    questions = questions.filter((q) => {
      const key = q.question.trim().toLowerCase();
      if (seenQuestions.has(key)) return false;
      seenQuestions.add(key);
      return true;
    });
    console.log("Tekrar kontrolü sonrası soru sayısı:", questions.length);

    // AI eksik soru döndürürse tekrar dene (max 2 deneme)
    if (questions.length < count && questions.length > 0) {
      console.log(`AI ${count} soru istendi ama ${questions.length} döndürdü. Tekrar deneniyor...`);
      try {
        const retryPrompt = prompt + `\n\nÖNEMLİ: Tam olarak ${count} soru üret! Şu an sadece ${questions.length} soru ürettin. Lütfen ${count} soru üret.`;
        const retryContent = await generateWithRetry(retryPrompt);
        let retryCleaned = retryContent.replace(/```json|```/g, "").trim();
        const retryJsonMatch = retryCleaned.match(/\[[\s\S]*\]/);
        if (retryJsonMatch) retryCleaned = retryJsonMatch[0];
        const retryQuestions = JSON.parse(retryCleaned);
        if (retryQuestions.length >= count) {
          questions = retryQuestions.slice(0, count);
          questions = validateQuestions(questions);
          const retrySeen = new Set();
          questions = questions.filter((q) => {
            const key = q.question.trim().toLowerCase();
            if (retrySeen.has(key)) return false;
            retrySeen.add(key);
            return true;
          });
          console.log("Tekrar deneme başarılı, soru sayısı:", questions.length);
        } else {
          console.log("Tekrar denemede de yeterli soru alınamadı, mevcut sorular kullanılıyor");
        }
      } catch (retryErr) {
        console.log("Tekrar deneme hatası:", retryErr.message);
      }
    }

    const quiz = new Quiz({
      user: req.user.userId,
      pdf: pdf._id,
      questions,
      questionType: qType,
      totalQuestions: questions.length,
    });
    await quiz.save();

    res.status(201).json(quiz);
  } catch (error) {
    console.error("=== QUIZ OLUŞTURMA HATASI ===");
    console.error("Hata mesajı:", error.message);
    console.error("Hata tipi:", error.name);
    console.error("Stack trace:", error.stack);
    console.error("==============================");

    if (error.message?.includes("503") || error.message?.includes("429")) {
      res.status(503).json({ message: "Yapay zeka servisi yoğun. Biraz bekleyip tekrar deneyin." });
    } else if (error.message?.includes("API_KEY_INVALID") || error.message?.includes("invalid")) {
      res.status(500).json({ message: "API anahtarı geçersiz. Lütfen ayarları kontrol edin." });
    } else if (error instanceof SyntaxError) {
      res.status(500).json({ message: "Yanıt işlenemedi. Lütfen tekrar deneyin." });
    } else {
      res.status(500).json({ message: "Quiz oluşturulamadı. Lütfen tekrar deneyin." });
    }
  }
});

function getEvalModel(name) {
  return genAI.getGenerativeModel({
    model: name,
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    },
  });
}

async function evaluateWrittenAnswers(pairs) {
  if (pairs.length === 0) return [];

  const prompt = `Sen bir sınav değerlendirme asistanısın. Aşağıda sorular, doğru cevaplar ve kullanıcı cevapları var.
Her kullanıcı cevabını doğru cevapla karşılaştır.
"correctAnswerText" Ana fikre veya anlama dayalı esnek bir değerlendirme yap.
- Eğer kullanıcı cevabı doğru cevabın anlamını taşıyorsa veya kabul edilebilir bir alternatifse "correct" yaz.
- Eğer tamamen yanlışsa veya alakasızsa "wrong" yaz.
- Eğer cevap boşsa "wrong" yaz.

Sadece JSON formatında yanıt ver. Format: [{"index":0,"result":"correct"},{"index":1,"result":"wrong"}]

DEĞERLENDİRME KURALLARI:
- Büyük/küçük harf farkı önemli değil.
- Yazım hatalarını görmezden gel.
- Eş anlamlı kelimeleri kabul et.
- Cümlenin tam olarak aynı olması gerekmez, ana fikir yeterli.
- Kısmi cevapları da değerlendir, sadece anahtar kelime arama.

${JSON.stringify(pairs.map((p, i) => ({
    index: i,
    question: p.question,
    correctAnswer: p.correctAnswer,
    userAnswer: p.userAnswer,
  })))}`;

  for (const modelName of models) {
    try {
      const m = getEvalModel(modelName);
      const result = await m.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const cleaned = text.replace(/```json|```/g, "").trim();
      const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const results = JSON.parse(jsonMatch[0]);
        return results;
      }
    } catch (err) {
      console.log(`Evaluation model ${modelName} hatası: ${err.message}`);
    }
  }

  return pairs.map((_, i) => ({ index: i, result: "wrong" }));
}

router.post("/:quizId/submit", auth, async (req, res) => {
  try {
    const { answers } = req.body;
    const quiz = await Quiz.findOne({ _id: req.params.quizId, user: req.user.userId });
    if (!quiz) {
      return res.status(404).json({ message: "Quiz bulunamadı." });
    }

    const writtenPairs = [];
    quiz.questions.forEach((q, i) => {
      if (q.questionType === "written") {
        const userText = answers[i] !== undefined ? String(answers[i]) : "";
        if (userText.trim() !== "") {
          writtenPairs.push({
            question: q.question,
            correctAnswer: q.correctAnswerText,
            userAnswer: userText,
          });
        }
      }
    });

    let evalResults = [];
    if (writtenPairs.length > 0) {
      evalResults = await evaluateWrittenAnswers(writtenPairs);
    }

    let score = 0;
    let answered = 0;
    const answerArray = [];
    const writtenResults = [];
    let evalIndex = 0;

    quiz.questions.forEach((q, i) => {
      if (q.questionType === "written") {
        const userText = answers[i] !== undefined ? String(answers[i]) : "";
        answerArray.push(userText);
        if (userText.trim() !== "") {
          answered++;
          const result = evalResults[evalIndex] ? evalResults[evalIndex].result : "wrong";
          if (result === "correct") score++;
          writtenResults.push(result);
          evalIndex++;
        } else {
          writtenResults.push(null);
        }
      } else {
        const userAnswer = answers[i] !== undefined ? Number(answers[i]) : -1;
        answerArray.push(userAnswer);
        writtenResults.push(null);
        if (userAnswer >= 0) {
          answered++;
          if (userAnswer === q.correctAnswer) score++;
        }
      }
    });

    quiz.score = score;
    quiz.answeredCount = answered;
    quiz.userAnswers = answerArray;
    quiz.writtenResults = writtenResults;
    quiz.completed = true;
    await quiz.save();

    res.json(quiz);
  } catch (error) {
    console.error("Quiz submit hatası:", error);
    res.status(500).json({ message: "İşlem başarısız oldu." });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ user: req.user.userId })
      .populate("pdf", "originalName")
      .sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: "Quizler yüklenemedi." });
  }
});

router.get("/:quizId", auth, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.quizId, user: req.user.userId }).populate("pdf", "originalName");
    if (!quiz) {
      return res.status(404).json({ message: "Quiz bulunamadı." });
    }
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: "Quiz yüklenemedi." });
  }
});

router.delete("/:quizId", auth, async (req, res) => {
  try {
    const quiz = await Quiz.findOneAndDelete({ _id: req.params.quizId, user: req.user.userId });
    if (!quiz) {
      return res.status(404).json({ message: "Quiz bulunamadı." });
    }
    res.json({ message: "Quiz silindi." });
  } catch (error) {
    res.status(500).json({ message: "Silme başarısız oldu." });
  }
});

module.exports = router;
