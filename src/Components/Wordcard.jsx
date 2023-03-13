import React,{useState} from 'react'
import NewCard from './NewCard';

import Card from './Card';
import { AiFillFileAdd } from 'react-icons/ai';
import { Swiper, SwiperSlide } from 'swiper/react'; 
import 'swiper/css';  

let localDB = JSON.parse(localStorage.getItem('WORDCARDS_DB')) || [];

function Wordcard() {
    const[newCardVisibility, setNewCardVisibility] = useState(false);

    function makeCreatorVisible(){
        newCardVisibility ? setNewCardVisibility(false) : setNewCardVisibility(true); 
        
        //reload the page to update the cards with the localDB
        console.log('newCardVisibility',newCardVisibility)
        if(newCardVisibility==true) {
            window.location.reload();
            };
    }

    function handleSlideChange(){
        console.log('slipping');
        
        }
    
    return (  
        <div className="container absolute h-full w-screen m-auto flex flex-col justify-center bg-slate-300">
            <button onClick={makeCreatorVisible} className='rounded-full z-20 m-2 w-11 h-11 self-end bg-slate-300 p-2 hover:bg-slate-50 '>
                <AiFillFileAdd className='h-6 w-6 m-auto '></AiFillFileAdd>
            </button>
            {newCardVisibility ? <NewCard changeVisibility={makeCreatorVisible} /> : null}
            {newCardVisibility ? <div className='h-full'></div> :
            <Swiper loop={true} spaceBetween={10}
                slidesPerView={1}
                // I want to use the onSlideChange event to trigger flipreset in CARD
                onSlideChange={() => {handleSlideChange()}}
                onSwiper={(swiper) => console.log(swiper)} 
                className='w-screen h-screen'>

                {localDB.length === 0 ? <div className='z-30'>Create your first Card</div> : null}
                {localDB.map((wordCard, index) => {
                    return <SwiperSlide className=''>
                                <Card 
                                    key={index}
                                    frontSide={wordCard.cardFront.wordA}
                                    backSide={wordCard.cardBack.wordB }
                                    flipReset={handleSlideChange}
                                />
                            </SwiperSlide>}
                )}
            </Swiper>}
            

            {/*   <div className="w-24 flex justify-between">
                    <Button xtraStyle='absolute' content= {<VscError className='h-6 w-6 m-auto '/>}/>
                    <Button content= {<GrStatusGood className='h-6 w-6 m-auto '/>}/>  
                    </div> */}
        </div>
    )
}

export default Wordcard