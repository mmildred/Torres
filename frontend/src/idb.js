
const DB='classroom'; const STORE_COURSES='courses';
function open(){ return new Promise((res,rej)=>{ const r=indexedDB.open(DB,2);
  r.onupgradeneeded=()=>{ const db=r.result; if(!db.objectStoreNames.contains(STORE_COURSES)) db.createObjectStore(STORE_COURSES,{keyPath:'id'}) }
  r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error) }); }
export async function addCourseLocal(course){
  const db=await open(); const tx=db.transaction(STORE_COURSES,'readwrite'); const st=tx.objectStore(STORE_COURSES);
  const id = course?.id ?? course?._id; if(!id) throw new Error('Course sin id'); st.put({ ...course, id }); await tx.complete; db.close();
}
export async function getCoursesLocal(){ const db=await open(); const tx=db.transaction(STORE_COURSES,'readonly'); const st=tx.objectStore(STORE_COURSES);
  return new Promise((res,rej)=>{ const req=st.getAll(); req.onsuccess=()=>{db.close(); res(req.result)}; req.onerror=()=>{db.close(); rej(req.error)} }) }
export async function replaceLocalCourse(tempId, serverCourse){
  const db=await open(); const tx=db.transaction(STORE_COURSES,'readwrite'); const st=tx.objectStore(STORE_COURSES);
  try{ await st.delete(tempId) }catch{}; st.put({ ...serverCourse, id: serverCourse.id || serverCourse._id }); await tx.complete; db.close();
}
