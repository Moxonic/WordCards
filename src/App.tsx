import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import Shell from './components/Shell';
import Login from './components/Login';
import Spinner from './components/Spinner';
import Home from './screens/Home';
import NewWriting from './screens/NewWriting';
import Editor from './screens/Editor';
import Results from './screens/Results';
import TextsList from './screens/TextsList';
import Review from './screens/Review';

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full w-full justify-center bg-slate-500">
      <div className="relative h-full w-full max-w-[480px] overflow-hidden bg-slate-100 shadow-2xl">
        {children}
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Frame>
        <div className="flex h-full items-center justify-center">
          <Spinner label="Laster…" />
        </div>
      </Frame>
    );
  }

  if (!user) {
    return (
      <Frame>
        <Login />
      </Frame>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<Home />} />
          <Route path="/new" element={<NewWriting />} />
          <Route path="/write/:id" element={<Editor />} />
          <Route path="/results/:id" element={<Results />} />
          <Route path="/texts" element={<TextsList />} />
          <Route path="/review/:writingId" element={<Review />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
