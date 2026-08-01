import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";
import Layout from "./components/layout/Layout";
import VoiceChatPage from "./pages/voice/VoiceChatPage";

export default function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<VoiceChatPage />} />
            <Route path="*" element={<VoiceChatPage />} />
          </Route>
        </Routes>
      </Router>
    </Provider>
  );
}
