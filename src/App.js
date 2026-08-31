import React from 'react';
import WordCard from './Components/Wordcard';
import Login from './Components/Login';
import { useAuth } from './context/AuthContext';

function App() {
  const { user, loading } = useAuth();

  return (
    // Phone-shaped frame, centred on any wider screen.
    <div className="h-screen w-screen flex justify-center bg-slate-500">
      <div className="relative w-full max-w-[430px] h-full overflow-hidden bg-slate-300 shadow-2xl">
        {loading ? (
          <div className="h-full w-full flex items-center justify-center bg-slate-300 text-slate-600">
            Loading…
          </div>
        ) : user ? (
          <WordCard />
        ) : (
          <Login />
        )}
      </div>
    </div>
  );
}

export default App;
