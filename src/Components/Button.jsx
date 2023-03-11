import React from 'react'


function Button(props) {
  return (
    
      <button 
      className='{props.xtraStyle}
      rounded-full m-2 w-11 h-11 self-center bg-slate-300 p-2 
      hover:bg-slate-50 
     '>

        {props.content}
      </button>
    
  )
}

export default Button