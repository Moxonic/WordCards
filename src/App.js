import React, { useState, useEffect } from 'react';
import Wordcard from './Components/Wordcard';
import Header from './Components/Header'
import Button from './Components/Button';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';


function App() {

  const getFromLocalStorage = () => {
    if (localStorage.getItem('words') !== null && localStorage.getItem('words').length !== 0) {
      const cards = JSON.parse(localStorage.getItem('words'));
      return cards[0].cardFront.word;
    }

    return ''
  } 

  const [ words, setWords ] = useState(() => getFromLocalStorage());

  const handleWords = (e) => {
    setWords(e.target.value);
  }

  const saveToLocalStorage = () => {
    const card = {
      cardId: Date.now(), // unique id
      cardFront: {
        word: words,
      },
      cardBack: {
      }
    }
    
    const currentCards = JSON.parse(localStorage.getItem('words'));
    const cardString = JSON.stringify([...currentCards, card]);

    localStorage.setItem('words', cardString);
  }

  const logOutLocalStorage = () => {
    console.log(JSON.parse(localStorage.getItem('words')));
  }

  return (
  <div className="mainContainer h-screen w-screen m-auto flex flex-col justify-center bg-slate-400">
    <div className="mx-auto cardContainer">

      <input onChange={handleWords} value={words} type="text" placeholder='Please enter some data' />
      <br />
      <button onClick={saveToLocalStorage}>Save Data</button>
      <br />
      <button onClick={logOutLocalStorage}> Console Log for local storage</button>
    </div>
  </div>  
  )
}

export default App;

