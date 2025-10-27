import React, { useState } from 'react'
import api from '../api'
import { saveAuth } from '../auth'
import { Link } from 'react-router-dom';

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
    {/* ✅ AGREGAR ESTA SECCIÓN - ENLACE DE RECUPERACIÓN */}
      <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
        <p style={{ marginBottom: '10px' }}>
          <Link 
            to="/forgot-password" 
            style={{ 
              color: '#667eea', 
              textDecoration: 'none',
              fontWeight: '500'
            }}
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
        <p>
          ¿No tienes cuenta?{' '}
          <Link 
            to="/register" 
            style={{ 
              color: '#667eea', 
              textDecoration: 'none', 
              fontWeight: 'bold' 
            }}
          >
            Regístrate aquí
          </Link>
        </p>
      </div>

      {msg && <p style={{color:'crimson', textAlign: 'center', marginTop: '10px'}}>{msg}</p>}
    </div>
  )
}

