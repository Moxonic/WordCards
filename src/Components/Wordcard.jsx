import React,{useState} from 'react'
import firstWordlist from '../Words/words';
import NewCard from './NewCard';

import ReactCardFlip from 'react-card-flip';
import Button from './Button';
import { AiFillFileAdd } from 'react-icons/ai';
import { GrStatusGood } from 'react-icons/gr';
import { VscError } from 'react-icons/vsc';



function Wordcard() {
    const[newCardVisibility, setNewCardVisibility] = useState(false);
    const[isFlipped, setFlipped] = useState(true);
        
    function flip(){        
        setFlipped(isFlipped? false : true)
    }

    function makeCreatorVisible(){
        newCardVisibility ? setNewCardVisibility(false) : setNewCardVisibility(true);
        
    }


    return ( 
        
        <div className="mainContainer h-screen w-screen m-auto flex flex-col justify-center bg-slate-300">

        <button 
        onClick={makeCreatorVisible}
        className='{props.xtraStyle}
        rounded-full m-2 w-11 h-11 self-center bg-slate-300 p-2 
        hover:bg-slate-50 
        '>
            <AiFillFileAdd className='h-6 w-6 m-auto '></AiFillFileAdd>
        </button>
        {newCardVisibility ? <NewCard changeVisibility={makeCreatorVisible} /> : null}
        <div className="wordCardButtonContainer bg-opacity-0 w-52 m-auto rounded">
            <ReactCardFlip isFlipped={isFlipped} flipDirection="horizontal" className='bg-black'>

                <div className={'cardContainer  frontSideColor w-52 h-60 mx-auto flex flex-col justify-center rounded'}>
                    <button className='w-full h-full' onClick={flip}>
                        <div className='h-fit self-center'>
                            {/* {firstWordlist[0].n} */}
                        </div>
                    </button>
                </div>
                <div className='cardContainer backSideColor w-52 h-60 mx-auto flex justify-center rounded'>
                    <button className='w-full h-full' onClick={flip}>
                        <div className='h-fit self-center'>
                            {/* {firstWordlist[0].e} */}
                        </div>
                    </button> 
                </div>
            </ReactCardFlip>
            <div className="flex justify-between">
            <Button xtraStyle='absolute' content= {<VscError className='h-6 w-6 m-auto '/>}/>
            <Button content= {<GrStatusGood className='h-6 w-6 m-auto '/>}/>  
            </div>
        </div>
        </div>
    )
}

export default Wordcard