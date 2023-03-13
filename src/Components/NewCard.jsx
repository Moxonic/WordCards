import React, { useState, useEffect } from 'react'

function NewCard(props) {
  const [isSaved, setSaved] = useState(false);
  const[isFlipped, setFlipped] = useState(true);
        
  function flip(){        
      setFlipped(isFlipped? false : true)
  }

  //Sets the initial state of the input fields to first check local storage for any saved data
  const getFromLocalStorage = () => {
    if (localStorage.getItem('WORDCARDS_DB') !== null && localStorage.getItem('WORDCARDS_DB').length !== 0) {
      const cards = JSON.parse(localStorage.getItem('WORDCARDS_DB'));
      return cards;
    }

    return  []
  } 
 /*  console.log(getFromLocalStorage()); */
  const [ inputA, setInputA ] = useState('');
  const [ inputB, setInputB ] = useState('');
  
  //Handles the input fields
  const handleInputA = (e) => {
    setInputA(e.target.value);
  }
  const handleInputB = (e) => {
    setInputB(e.target.value);
  }
  //Saves the input fields to local storage
  const saveToLocalStorage = () => {
    const card = {
      cardId: Date.now(), // unique id
      cardFront: {
        wordA: inputA,
      },
      cardBack: {
        wordB: inputB,
      }
    }

    const currentCards = JSON.parse(localStorage.getItem('WORDCARDS_DB')) || [];
    const cardString = JSON.stringify([...currentCards, card]);
    
    //Resets the input fields to an empty string after saving to local storage
    localStorage.setItem('WORDCARDS_DB', cardString);
    setInputA('');
    setInputB('');
    
    //Makes the new card creator invisible after saving to local storage
    props.changeVisibility();  
  }

  const logOutLocalStorage = () => {
    console.log(JSON.parse(localStorage.getItem('WORDCARDS_DB')));
  }


  return (
    <div className="absolute z-10 w-screen">
      <div className="mx-auto cardContainer flex flex-col m-auto">

          <div className='cardContainer frontSideColor w-52 h-16 m-1 mx-auto flex flex-col justify-center rounded'>
                  <div className='h-fit self-center bg-opacity-5'>
                    <input className='bg-opacity-5 ' onChange={handleInputA} value={inputA} type="text" placeholder='Frontside...' />
                  </div>
          </div>
          <div className='cardContainer backSideColor w-52 h-16 m-1 mx-auto flex flex-col justify-center rounded'>
                  <div className='h-fit self-center'>
                    <input onChange={handleInputB} value={inputB} type="text" placeholder='Backside...' />
                  </div>
          </div>
          <div className='savebutton h-10 w-screen flex'>
            {inputA && inputB && <button className='bg-slate-200 w-24 mx-auto my-3 rounded-xl h-fit' onClick={saveToLocalStorage}>Save</button>}
          </div>
        
        <button onClick={logOutLocalStorage}> Console Log for local storage</button>
        <button onClick={() => localStorage.clear()}>Clear local storage</button>
    </div>
  </div>

 
  )
}

export default NewCard