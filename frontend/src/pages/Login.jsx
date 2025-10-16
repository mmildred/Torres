
import React, { useState } from 'react'
import api from '../api'
import { saveAuth } from '../auth'

export default function Login(){
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [msg,setMsg]=useState('')
  async function submit(e){ e.preventDefault(); setMsg('')
    try{
      const res = await api.post('/auth/login',{ email, password })
      saveAuth(res.data.token, res.data.user)
      location.href='/courses'
    }catch(err){ setMsg(err.response?.data?.message||'Error de login') }
  }
  return (<div>
    <h2>Login</h2>
    <form onSubmit={submit}>
      <input placeholder='email' value={email} onChange={e=>setEmail(e.target.value)} />{' '}
      <input placeholder='password' type='password' value={password} onChange={e=>setPassword(e.target.value)} />{' '}
      <button>Entrar</button>
    </form>
    {msg && <p style={{color:'crimson'}}>{msg}</p>}
  </div>)
}
