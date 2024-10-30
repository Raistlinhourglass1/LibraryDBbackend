import React from 'react'

function login() {
  return (
    <div className='d-flex justify-content-center align-item-center bg-primary vh-100'>
        <div className='bg-white p-3 rounded w-25'>
            <form action="">
                <div className='mb-3'   >
                    <label htmlFor="email">Email</label>   
                    <input type="email" placeholder='Enter Email'/>
                </div>
                <div className='mb-3'   >
                    <label htmlFor="password">Password</label>   
                    <input type="pasword" placeholder='Enter Password'/>
                </div>
                <button className='btn btn-sucess'>Log In</button>
                <p>You are agreeing to our terms and conditions</p>
                <button className='btn btn-default border'>Create Account</button>
            </form>
        </div>
    </div>
  )
}

export default login