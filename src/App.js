import React from 'react';
import WordCard from './Components/Wordcard';
import Header from './Components/Header';
function App() {
  return (
    <div className="App relative ">
      <Header className='absolute top-0'/>
      <WordCard />
    </div>
  );
}

export default App;

