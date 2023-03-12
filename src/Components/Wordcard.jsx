import React,{useState} from 'react'
import NewCard from './NewCard';

import Card from './Card';
import { AiFillFileAdd } from 'react-icons/ai';
import { Swiper, SwiperSlide } from 'swiper/react'; 
import 'swiper/css';  



function Wordcard() {
    const[newCardVisibility, setNewCardVisibility] = useState(false);
    console.log(newCardVisibility)
    function makeCreatorVisible(){
        console.log('clicked')
        newCardVisibility ? setNewCardVisibility(false) : setNewCardVisibility(true);   
    ;}
    /* function randomWord(){

    } */
    return (  
        <div className="container h-fit w-screen m-auto flex flex-col justify-center bg-slate-300">
           
            <button 
            onClick={makeCreatorVisible}
            className='rounded-full z-20 m-2 w-11 h-11 self-end bg-slate-300 p-2 hover:bg-slate-50 
            '>
                <AiFillFileAdd className='h-6 w-6 m-auto '></AiFillFileAdd>
            </button>
            {newCardVisibility ? <NewCard changeVisibility={makeCreatorVisible} /> : null}
            <Swiper loop={true} spaceBetween={10}
                slidesPerView={1}
                onSlideChange={() => console.log('slide change')}
                onSwiper={(swiper) => console.log(swiper)} 
                className='w-screen h-screen'>

                <SwiperSlide className=''>
                    <Card wordIndex={0}/>
                </SwiperSlide>
                <SwiperSlide className=''>
                    <Card wordIndex={1}/>
                </SwiperSlide>
             


            </Swiper>

            {/*   <div className="w-24 flex justify-between">
                    <Button xtraStyle='absolute' content= {<VscError className='h-6 w-6 m-auto '/>}/>
                    <Button content= {<GrStatusGood className='h-6 w-6 m-auto '/>}/>  
                    </div> */}
        </div>
    )
}

export default Wordcard