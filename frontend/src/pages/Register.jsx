
import React, { useState } from 'react'
import api from '../api'
import { saveAuth } from '../auth'

export default function Register(){
  const [name,setName]=useState(''); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [role,setRole]=useState('teacher'); const [msg,setMsg]=useState('')
  async function submit(e){ e.preventDefault(); setMsg('')
    try{
      const res = await api.post('/auth/register',{ name, email, password, role })
      saveAuth(res.data.token, res.data.user); location.href='/courses'
    }catch(err){ setMsg(err.response?.data?.message||'Error de registro') }
  }
  return (<div>
    <h2>Registro</h2>
    <form onSubmit={submit}>
      <input placeholder='nombre' value={name} onChange={e=>setName(e.target.value)} />{' '}
      <input placeholder='email' value={email} onChange={e=>setEmail(e.target.value)} />{' '}
      <input placeholder='password' type='password' value={password} onChange={e=>setPassword(e.target.value)} />{' '}
      <select value={role} onChange={e=>setRole(e.target.value)}>
        <option value='student'>student</option>
        <option value='teacher'>teacher</option>
      </select>{' '}
      <button>Crear cuenta</button>
    </form>
    {msg && <p style={{color:'crimson'}}>{msg}</p>}
  </div>)
}
