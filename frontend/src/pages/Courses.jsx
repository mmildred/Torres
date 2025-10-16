
import React, { useEffect, useState } from 'react'
import api from '../api'
import { addCourseLocal, getCoursesLocal, replaceLocalCourse } from '../idb'
import { getUser, getToken } from '../auth'
import { queueOp, syncNow } from '../offline/syncClient'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function normalizeCourse(c){
  const id = c?.id ?? c?._id ?? ('c-'+crypto.randomUUID())
  const title = c?.title ?? ''
  const description = c?.description ?? ''
  const contents = Array.isArray(c?.contents) ? c.contents.map(ct=>{
    const name = ct?.name ?? ct?.filename ?? 'archivo'
    const rawPath = ct?.path ?? ct?.url ?? ''
    const path = rawPath && rawPath.startsWith?.('http') ? rawPath : (rawPath ? `${API}/uploads/${rawPath}` : '')
    return { ...ct, name, path }
  }) : []
  return { ...c, id, title, description, contents }
}

export default function Courses(){
  const [courses,setCourses]=useState([])
  const [title,setTitle]=useState(''); const [desc,setDesc]=useState('')
  const [file,setFile]=useState(null)
  const user = getUser()

  useEffect(()=>{ fetchCourses() },[])

  async function fetchCourses(){
    try{
      const res = await api.get('/courses')
      const raw = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : [])
      const list = raw.map(normalizeCourse)
      setCourses(list)
      for(const c of list) await addCourseLocal(c)
    }catch{
      const local = await getCoursesLocal()
      setCourses((local||[]).map(normalizeCourse))
    }
  }

  async function createCourse(e){
    e.preventDefault()
    if(!user || user.role!=='teacher'){ alert('Solo profesores pueden crear cursos.'); return }
    try{
      const res = await api.post('/courses',{ title, description: desc })
      const course = normalizeCourse(res.data)
      setCourses(p=>[...p, course]); await addCourseLocal(course)
      setTitle(''); setDesc('')
    }catch{
      const tempId = 'tmp-'+Date.now()
      const temp = normalizeCourse({ id: tempId, title, description: desc, contents: [], ownerId: user?.id, createdAt: new Date().toISOString() })
      await addCourseLocal(temp)
      await queueOp({ type:'create-course', payload:{ tempId, title, description: desc } })
      setCourses(p=>[...p, temp]); setTitle(''); setDesc('')
      alert('Curso guardado offline. Sincronízalo cuando vuelvas a estar en línea.')
    }
  }

  async function uploadContent(course){
    if(!file) return alert('Selecciona un archivo')
    if(!user || user.role!=='teacher') return alert('Solo profesores pueden subir contenido')
    if ((course?.id ?? '').startsWith('tmp-')){
      return alert('Primero sincroniza el curso (tiene id temporal).')
    }
    const form = new FormData(); form.append('file', file)
    try{
      await api.post(`/courses/upload/${course.id}`, form)
      await fetchCourses()
    }catch{
      alert('Error al subir (¿offline?). Sube el archivo cuando tengas conexión.')
    }
  }

  async function manualSync(){
    try{
      const data = await syncNow(API, getToken())
      window.addEventListener('sync:map', async (e)=>{
        const map = e.detail
        for (const [tmp, srv] of Object.entries(map)){
          const found = courses.find(c=>c.id===tmp)
          if(found){ await replaceLocalCourse(tmp, { ...found, id: srv }) }
        }
      }, { once:true })
      await fetchCourses()
      alert('Sincronización intentada')
    }catch(e){ alert('Fallo al sincronizar: '+e.message) }
  }

  async function downloadForOffline(c){
    try{
      const { data } = await api.get(`/courses/${c.id}/manifest`)
      const urls = (data.files||[]).map(f=>`${API}/uploads/${f.path}`)
      const cache = await caches.open('courses-v1'); await cache.addAll(urls)
      alert('Contenido descargado para offline')
    }catch{ alert('No se pudo descargar el contenido') }
  }

  return (<div>
    <div style={{border:'1px solid #ddd', padding:16, borderRadius:8, marginBottom:16}}>
      <h2>Crear curso</h2>
      <form onSubmit={createCourse}>
        <input placeholder='Título' value={title} onChange={e=>setTitle(e.target.value)} required />{' '}
        <input placeholder='Descripción' value={desc} onChange={e=>setDesc(e.target.value)} />{' '}
        <button>Crear</button>{' '}
        <button type='button' onClick={manualSync}>Sincronizar cola</button>
      </form>
      {(!user || user.role!=='teacher') && <p style={{fontSize:12,color:'#666'}}>Necesitas ser profesor para crear cursos.</p>}
    </div>

    <div style={{border:'1px solid #ddd', padding:16, borderRadius:8, marginBottom:16}}>
      <h2>Subir contenido</h2>
      <input type='file' onChange={e=>setFile(e.target.files[0])}/>
    </div>

    <div style={{border:'1px solid #ddd', padding:16, borderRadius:8}}>
      <h3>Cursos</h3>
      <ul style={{listStyle:'none', padding:0}}>
        {courses.map(c=>(
          <li key={c.id} style={{margin:'12px 0'}}>
            <div style={{border:'1px solid #eee', padding:12, borderRadius:8, display:'flex', justifyContent:'space-between'}}>
              <div>
                <strong>{c.title}</strong>
                <p style={{marginTop:4, color:'#555'}}>{c.description}{' '}
                  {(c?.id?.startsWith?.('tmp-')) && <span style={{fontSize:12,color:'#a97800'}}>(temporal)</span>}
                </p>
                <div>
                  {(c.contents||[]).map(ct=>(
                    <div key={ct._id || ct.id}><a href={ct.path} target='_blank' rel='noreferrer'>{ct.name}</a></div>
                  ))}
                </div>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:8}}>
                <button onClick={()=>downloadForOffline(c)}>Descargar</button>
                {user?.role==='teacher' && <button onClick={()=>uploadContent(c)}>Subir</button>}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </div>)
}
