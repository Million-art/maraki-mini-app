import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ChatPage from "./components/ChatPage";
import MaterialPage from "./components/MaterialPage";
import QuizPage from "./components/QuizPage";
import ReferralPage from "./components/ReferralPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ChatPage />} />
          <Route path="material" element={<MaterialPage />} />
          <Route path="quiz" element={<QuizPage />} />
          <Route path="referral" element={<ReferralPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
