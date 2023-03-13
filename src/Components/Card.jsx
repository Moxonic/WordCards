import React,{useState} from 'react'
import ReactCardFlip from 'react-card-flip';

function Card(props) {
    const[isFlipped, setFlipped] = useState(false);
    
    function flip(){        
        setFlipped(isFlipped? false : true)
    }

    function resetFlip(){
        setFlipped(false);
    }

    return (
    <div className="wordCardButtonContainer bg-opacity-0 m-auto mt-10 ">    
        <ReactCardFlip isFlipped={isFlipped} flipDirection="horizontal" className='bg-black '>
            <div className={'absolut bottom-12 m-auto cardContainer frontSideColor w-4/6  flex flex-col justify-center rounded-xl'}>
                <button className='h-96 w-full' onClick={flip}>
                    <div className=' justify-center self-center'>
                        {props.frontSide} 
                    </div>
                </button>
            </div>
            <div className='cardContainer backSideColor w-4/6  mx-auto flex justify-center rounded-xl'>
                <button className='h-96 w-full' onClick={flip}>
                    <div className=' self-center'>
                        {props.backSide}
                    </div>
                </button> 
            </div>
        </ReactCardFlip>
    </div>
  )
}

export default Card