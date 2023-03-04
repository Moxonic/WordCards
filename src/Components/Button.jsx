import React from 'react'
import { GrStatusGood } from 'react-icons/gr';
import { VscError } from 'react-icons/vsc';


function Button(props) {
  return (
    <div>
        <button>
            <div className='w-lg h-lg {props.color}'>
                {props.buttonLogo}
            </div>
        </button>
    </div>
  )
}

export default Button