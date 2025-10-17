import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";
import Layout from "./components/layout/Layout";
import MaterialPage from "./pages/material/MaterialPage";
import QuizListPage from "./pages/quize/QuizListPage";
import QuizDetailPage from "./pages/quize/QuizDetailPage";
import ReferralPage from "./pages/referral/ReferralPage";

export default function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route path="material" element={<MaterialPage />} />
            <Route path="quiz" element={<QuizListPage />} />
            <Route path="quiz/:quizId" element={<QuizDetailPage />} />
            <Route path="referral" element={<ReferralPage />} />
          </Route>
        </Routes>
      </Router>
    </Provider>
  );
}
