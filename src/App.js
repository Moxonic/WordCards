import React, { useState, useEffect } from 'react';
import Wordcard from './Components/Wordcard';
import Header from './Components/Header'
import Button from './Components/Button';

import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';


function App() {
  const getFromLocalStorage = () => {
    if (localStorage.getItem('words') !== null) {
      return localStorage.getItem('words');
    }

    return ''
  } 

  const [ words, setWords ] = useState(() => getFromLocalStorage());

  const handleWords = (e) => {
    setWords(e.target.value);
  }

  const saveToLocalStorage = () => {
    localStorage.setItem('words', words);
  }


  return (
  <div className="mainContainer h-screen w-screen m-auto flex flex-col justify-center bg-slate-400">
    <div className="mx-auto cardContainer">

      <input onChange={handleWords} value={words} type="text" placeholder='Please enter some data' />
      <br />
      <button onClick={saveToLocalStorage}>Save Data</button>
      <br />
      <button onClick={getFromLocalStorage}> Console Log for local storage</button>
    </div>
  </div>  
  )
}

export default App;
