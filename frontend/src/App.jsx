
import React from 'react'
import { Outlet, Link } from 'react-router-dom'
import { getUser, logout } from './auth'

export default function App(){
  const user = getUser()
  return (
    <div style={{maxWidth: 800, margin: '20px auto', fontFamily: 'system-ui, Arial'}}>
      <header style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
        <h1>📘 Classroom</h1>
        <nav style={{display:'flex', gap:12}}>
          <Link to='/courses'>Cursos</Link>
          {!user && <Link to='/login'>Login</Link>}
          {!user && <Link to='/register'>Registro</Link>}
          {user && <button onClick={()=>{ logout(); location.href='/login'; }}>Salir ({user.role})</button>}
        </nav>
      </header>
      <Outlet/>
    </div>
  )
}
