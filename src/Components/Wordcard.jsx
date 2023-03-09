import React,{useState} from 'react'
import firstWordlist from '../Words/words'
import ReactCardFlip from 'react-card-flip';
import Button from './Button';
import { GrStatusGood } from 'react-icons/gr';
import { VscError } from 'react-icons/vsc';



function Wordcard() {
    const[isFlipped, setFlipped] = useState(true);
        
        function flip(){        
            setFlipped(isFlipped? false : true)
            console.log('FLIP', isFlipped)
        }

    return ( 

        <div className="wordCardButtonContainer bg-opacity-0 w-52 m-auto rounded">
        <ReactCardFlip isFlipped={isFlipped} flipDirection="horizontal" className='bg-black'>

            <div className={'cardContainer  bg-green-600 w-52 h-60 mx-auto flex flex-col justify-center rounded'}>
                <button className='w-full h-full' onClick={flip}>
                    <div className='h-fit self-center'>
                        {firstWordlist[0].n}
                    </div>
                </button>
            </div>
            <div className='cardContainer bg-yellow-500 w-52 h-60 mx-auto flex justify-center rounded'>
                <button className='w-full h-full' onClick={flip}>
                    <div className='h-fit self-center'>
                        {firstWordlist[0].e}
                    </div>
                </button> 
            </div>
        </ReactCardFlip>
        <div className="flex justify-between">
        <Button xtraStyle='absolute' content= {<VscError className='h-6 w-6 m-auto '/>}/>
        <Button content= {<GrStatusGood className='h-6 w-6 m-auto '/>}/>  
        </div>
        </div>
    )
}

export default Wordcard