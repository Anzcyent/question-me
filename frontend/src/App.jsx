import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState } from "react";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Quiz from "./pages/Quiz";
import QuizResult from "./pages/QuizResult";
import MyQuizzes from "./pages/MyQuizzes";
import OAuthCallback from "./pages/OAuthCallback";
import VerifyEmail from "./pages/VerifyEmail";
import VerifyEmailSent from "./pages/VerifyEmailSent";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { ToastProvider } from "./components/Toast";

function App() {
  const [token, setToken] = useState(
    localStorage.getItem("token") || sessionStorage.getItem("token")
  );
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    const saved = JSON.parse(raw || "null");
    if (saved && saved.avatar) {
      const clean = { ...saved };
      delete clean.avatar;
      const store = localStorage.getItem("user") ? localStorage : sessionStorage;
      store.setItem("user", JSON.stringify(clean));
      return clean;
    }
    return saved;
  });

  const login = (token, user, remember = true) => {
    const clean = { ...user };
    delete clean.avatar;
    const store = remember ? localStorage : sessionStorage;
    store.setItem("token", token);
    store.setItem("user", JSON.stringify(clean));
    setToken(token);
    setUser(clean);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <Router>
      <ToastProvider>
        <Main token={token} user={user} login={login} logout={logout} />
      </ToastProvider>
    </Router>
  );
}

function Main({ token, user, login, logout }) {
  const location = useLocation();
  const isAuthPage =
    !token && (
      ["/", "/login", "/register", "/verify-email-sent", "/forgot-password"].includes(location.pathname) ||
      location.pathname.startsWith("/verify-email") ||
      location.pathname.startsWith("/reset-password")
    );
  const isDashboard = token && location.pathname === "/";
  const isQuizzesPage = token && location.pathname === "/quizzes";
  const isFullscreen = token && (location.pathname.startsWith("/quiz-result/") || location.pathname.startsWith("/quiz/"));
  const isLanding = isAuthPage;
  const isPage = isDashboard || isQuizzesPage;

  return (
    <div className="app">
      <Navbar token={token} user={user} logout={logout} isLanding={isLanding} />
      <div
        className={
          isPage ? "container container--page" : isAuthPage || isFullscreen ? "" : "container"
        }
      >
        <Routes>
          <Route path="/" element={token ? <Dashboard token={token} user={user} /> : <Home login={login} />} />
          <Route path="/login" element={token ? <Navigate to="/" /> : <Home login={login} />} />
          <Route path="/register" element={token ? <Navigate to="/" /> : <Home login={login} />} />
          <Route path="/auth/callback" element={<OAuthCallback login={login} />} />
          <Route path="/verify-email-sent" element={<VerifyEmailSent />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={token ? <Navigate to="/" /> : <Home login={login} />} />
          <Route path="/reset-password/:token" element={token ? <Navigate to="/" /> : <Home login={login} />} />
          <Route path="/upload" element={<Navigate to="/" />} />
          <Route path="/quiz/:quizId" element={token ? <Quiz token={token} /> : <Navigate to="/" />} />
          <Route path="/quiz-result/:quizId" element={token ? <QuizResult token={token} /> : <Navigate to="/" />} />
          <Route path="/my-quizzes" element={token ? <MyQuizzes token={token} /> : <Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;