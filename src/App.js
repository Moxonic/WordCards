import React from 'react';
import Wordcard from './Components/Wordcard';
import Button from './Components/Button';
import { GrStatusGood } from 'react-icons/gr';
import { VscError } from 'react-icons/vsc';

function App() {
  return (
  <div className="container h-screen w-screen flex flex-col justify-center bg-slate-400">
    <h1 className='text-center p-2'>WORDCARDS</h1>
      <button className='rounded-full m-2 w-11 h-11 self-center bg-slate-300 p-2'>
        +
      </button>
      <div className="wordCardButtonContainer bg-slate-100 w-52 m-auto rounded">
        <Wordcard/>
        <div className='w-full flex justify-between p-5'>
            <button className='rounded-full bg-slate-300 p-2'>
              <VscError className='h-6 w-6 '/>
            </button>
            <button className='rounded-full bg-slate-300 p-2'>
              <GrStatusGood className='h-6 w-6  text-green-500'/>
            </button>
        </div>
      </div>    
  </div>
  );
}

export default App;
