import React from 'react';
import Wordcard from './Components/Wordcard';
import Header from './Components/Header'
import Button from './Components/Button';

import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';




function App() {
  return (
  <div className="mainContainer h-screen w-screen m-auto flex flex-col justify-center bg-slate-400">
    <Header />
    <Button content='+'/> 
    <Swiper
      className='w-screen'
      spaceBetween={100}
      slidesPerView={1}
      onSlideChange={() => console.log('slide change')}
      onSwiper={(swiper) => console.log(swiper)}
    >
      <SwiperSlide>
        <Wordcard/>
      </SwiperSlide>

      <SwiperSlide>
        <Wordcard/>
      </SwiperSlide>
   
     
     
    </Swiper>
  </div>  
  )
}

export default App;
