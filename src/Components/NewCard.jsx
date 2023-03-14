import React, { useState} from 'react';
import {IoWarningOutline} from 'react-icons/io5';

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
    <div className="createContainer flex flex-col z-10 h-full w-screen ">
      <div className='h-12 w-screen flex justify-start'>
        <IoWarningOutline className='h-5 w-5 m-1 self-center text-red-700'/> 
        <button className='align-top  text-red-700 ' onClick={() => localStorage.clear()}>  
          <p>Clear local storage</p>
        </button>    
      </div>
      <div className="mx-auto justify-end h-96 cardContainer flex flex-col">
            <div className='cardContainer m-5 frontSideColor w-52 h-16 m-1 mx-auto flex flex-col justify-center rounded-xl'>
                    <div className='h-fit self-center bg-opacity-5'>
                      <input className='h-10 rounded-xl' onChange={handleInputA} value={inputA} type="text" placeholder='Frontside...' />
                    </div>
            </div>
            <div className='cardContainer m-5 backSideColor w-52 h-16 m-1 mx-auto flex flex-col justify-center rounded-xl'>
                    <div className='h-fit self-center'>
                      <input className='h-10 rounded-xl' onChange={handleInputB} value={inputB} type="text" placeholder='Backside...' />
                    </div>
            </div>
            <div className='savebutton h-24 w-screen flex '>
              {inputA && inputB && <button className='bg-slate-200  h-12 w-52  mx-auto my-3 rounded-xl h-fit' onClick={saveToLocalStorage}>Save</button>}
            </div>  
      </div>
  </div>

 
  )
}

export default NewCard