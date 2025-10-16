
const DB_NAME = 'classroom'; const STORE = 'sync-ops';
function openDB(){ return new Promise((res,rej)=>{ const r = indexedDB.open(DB_NAME,1);
  r.onupgradeneeded = ()=>{ const db=r.result; if(!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE,{keyPath:'id'}) }
  r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); }); }
export async function queueOp(op){
  const db = await openDB(); const tx=db.transaction(STORE,'readwrite'); const st=tx.objectStore(STORE);
  const withId = { id: op.id || ('op-'+crypto.randomUUID()), ...op }; st.put(withId); await tx.complete; db.close();
  if('serviceWorker' in navigator && 'SyncManager' in window){ const reg = await navigator.serviceWorker.ready; try{ await reg.sync.register('sync-queue') }catch{} }
  return withId.id;
}
export async function readAllOps(){
  const db = await openDB(); const tx=db.transaction(STORE,'readonly'); const st=tx.objectStore(STORE);
  return new Promise((res,rej)=>{ const req=st.getAll(); req.onsuccess=()=>{ db.close(); res(req.result)}; req.onerror=()=>{db.close(); rej(req.error)} })
}
export async function removeOp(id){
  const db = await openDB(); const tx=db.transaction(STORE,'readwrite'); tx.objectStore(STORE).delete(id); await tx.complete; db.close();
}
export async function syncNow(apiBase, token){
  const ops = await readAllOps(); if(!ops.length) return { applied:[], errors:[] }
  const body = { ops: ops.map(({id, ...rest})=>({ opId:id, ...rest })) }
  const res = await fetch(`${apiBase}/sync`, { method:'POST', headers:{ 'Content-Type':'application/json','Authorization':'Bearer '+token }, body: JSON.stringify(body) })
  if(!res.ok) throw new Error('sync failed '+res.status); const data = await res.json();
  for(const a of data.applied||[]){ if(a.map) window.dispatchEvent(new CustomEvent('sync:map',{ detail:a.map })); if(a.status==='ok'||a.status==='skip') await removeOp(a.opId) }
  return data
}
navigator.serviceWorker?.addEventListener('message', async (evt)=>{
  if(evt.data?.type==='SW_SYNC_REQUEST'){ try{ const token = localStorage.getItem('token'); const apiBase = import.meta.env.VITE_API_URL; if(token) await syncNow(apiBase, token) }catch(e){} }
})
