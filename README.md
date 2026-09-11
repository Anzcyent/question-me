# Question Me - PDF Quiz Generator

MERN stack tabanlı, kullanıcının PDF yüklediği ve yapay zekanın içerikten quiz oluşturduğu uygulama.

## Özellikler
- Kullanıcı kayıt / giriş (JWT + bcrypt)
- Google ile giriş (OAuth 2.0)
- PDF yükleme (multer + pdf-parse)
- Google Gemini (AI) ile PDF içeriğinden 10 çoktan seçmeli soru üretimi
- Quiz çözme ve sonuç gösterme
- Quiz geçmişi

## Kurulum

### Backend
```bash
cd backend
npm install
```
`backend/.env` dosyasındaki `GEMINI_API_KEY` değeri Google Gemini API anahtarınızla aynı olmalıdır.

### Frontend
```bash
cd frontend
npm install
```

## Çalıştırma

### Backend (port 5000)
```bash
cd backend
npm run dev
```

### Frontend (port 3000)
```bash
cd frontend
npm run dev
```

Tarayıcıda `http://localhost:3000` adresini aç.

## Notlar
- MONGODB_URI ve JWT_SECRET `backend/.env` dosyasında tanımlıdır.
- Google Gemini API anahtarı olmadan quiz oluşturma çalışmaz.

## Google Girişi Kurulumu
1. [Google Cloud Console](https://console.cloud.google.com/)'da proje seç.
2. **APIs & Services > Credentials > Create Credentials > OAuth client ID** ile "Web application" tipinde kimlik oluştur.
3. Authorized JavaScript origins'e `http://localhost:3000` ekle.
4. Authorized redirect URIs'e `http://localhost:5000/api/auth/google/callback` ekle.
5. `backend/.env` dosyasındaki `GOOGLE_CLIENT_ID` ve `GOOGLE_CLIENT_SECRET` değerlerini doldur.
6. Backend'i yeniden başlat.
- PDF boyutu maksimum 10MB'a kadar desteklenir.