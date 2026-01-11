import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./app/routes/Login";
import RegisterPage from "./app/routes/Register";
import ProtectedRoute from "./app/routes/ProtectedRoute";
import ChatPage from "./app/routes/Chat";


function App() {
  return (
    <BrowserRouter>
      <Routes>
         {/* Default */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
