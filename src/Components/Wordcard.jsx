import React,{useState} from 'react'
import firstWordlist from '../Words/words'
import ReactCardFlip from 'react-card-flip';



function Wordcard() {
    const[isFlipped, setFlipped] = useState(true);
        
        function flip(){        
            setFlipped(isFlipped? false : true)
            console.log('FLIP', isFlipped)
        }

    return (
        <div className={`cardContainer  ${isFlipped? 'bg-green-600':'bg-yellow-500'}  w-52 h-60 mx-auto flex justify-center rounded`}>
            <button className='w-full' onClick={flip}>
                <ReactCardFlip isFlipped={isFlipped} flipDirection="horizontal">

                <div className='h-fit self-center'>
                    {firstWordlist[0].n}
                </div>

                <div className='h-fit self-center'>
                    {firstWordlist[0].e}
                </div>
                </ReactCardFlip>

            </button>
        </div>
    )
}

export default Wordcard