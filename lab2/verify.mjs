// Run against the deployed Node-RED runtime: node lab2/verify.mjs
import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'node:fs/promises';
const base = 'http://127.0.0.1:1880';
const results = [];
async function check(path, status, predicate) {
    const response = await fetch(base + path);
    const text = await response.text();
    assert.equal(response.status, status, path);
    assert.ok(predicate(text), `${path}: unexpected body ${text}`);
    results.push({path,status:response.status,body:text});
}
await check('/api/text',200,t=>t.includes('Беляева'));
await check('/api/info',200,t=>Object.keys(JSON.parse(t)).length===2 && JSON.parse(t).group==='СДП-ИИ-241');
await check('/api/items',200,t=>JSON.parse(t).length===3);
await check('/api/items?id=1',200,t=>JSON.parse(t).name==='Пицца');
for (const value of ['abc','0','-1','1.5','']) {
    await check('/api/items?id='+value,400,t=>typeof JSON.parse(t).error==='string');
}
await check('/api/items?id=99',404,t=>JSON.parse(t).error==='Блюдо не найдено');
const messages=[];
const socket=new WebSocket('ws://127.0.0.1:1880/comms');
await new Promise((resolve,reject)=>{
    socket.addEventListener('open',()=>{socket.send(JSON.stringify({subscribe:'debug'}));resolve();},{once:true});
    socket.addEventListener('error',reject,{once:true});
});
socket.addEventListener('message',event=>{
    try { const packets=JSON.parse(event.data); for (const packet of Array.isArray(packets)?packets:[packets]) { if (packet.topic==='debug') messages.push(packet.data); } } catch {}
});
for (const id of ['i01','i02','i03','i03-low','i04','i05','i06','i7','i09','i11-write','i11-read','i12','i13']) {
    const response=await fetch(`${base}/inject/${id}`,{method:'POST'});
    assert.equal(response.status,200,`Inject ${id}`);
    if (id === 'i11-write') await new Promise(resolve=>setTimeout(resolve,700));
}
await new Promise(resolve=>setTimeout(resolve,12000));
socket.close();
for (const id of ['d01','d02','d03-high','d03-low','d04','d05','d06','d7','d11','d12','d13']) {
    assert.ok(messages.some(message=>message.id===id), `No Debug message from ${id}`);
}
const httpMessage=JSON.parse(messages.find(message=>message.id==='d06').msg);
assert.equal(httpMessage.statusCode,200,'Public HTTP API');
assert.equal(typeof httpMessage.payload.setup,'string','Parsed public API JSON');
for (const [id,total] of [['d03-high',35],['d03-low',17]]) {
    assert.equal(JSON.parse(messages.find(message=>message.id===id).msg).payload.total,total,id);
}
await mkdir(new URL('./docs/',import.meta.url),{recursive:true});
await writeFile(new URL('./docs/verification.json',import.meta.url),JSON.stringify({checkedAt:new Date().toISOString(),api:results,debug:messages.filter(m=>!['d10'].includes(m.id))},null,2)+'\n');
console.log(`PASS: ${results.length} HTTP requests; function branches, template, files, context, public and local MQTT received in Debug`);
