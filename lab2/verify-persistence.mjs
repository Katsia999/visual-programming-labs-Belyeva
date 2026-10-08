import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=new URL('./',import.meta.url);
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const base='http://127.0.0.1:1880';
async function observe(inject,id) {
    const socket=new WebSocket('ws://127.0.0.1:1880/comms');
    await new Promise((resolve,reject)=>{socket.onopen=()=>{socket.send(JSON.stringify({subscribe:'debug'}));resolve();};socket.onerror=reject;});
    const result=new Promise((resolve,reject)=>{
        const timeout=setTimeout(()=>{socket.close();reject(new Error('No message from '+id));},10000);
        socket.onmessage=event=>{for(const packet of JSON.parse(event.data)){if(packet.topic==='debug'&&packet.data.id===id){clearTimeout(timeout);socket.close();resolve(JSON.parse(packet.data.msg));}}};
    });
    await pause(150);
    assert.equal((await fetch(base+'/inject/'+inject,{method:'POST'})).status,200);
    return result;
}
const before=await observe('i12','d12');
await pause(6000);
const original=await readFile(new URL('runtime/node-red/order.json',root),'utf8');
execFileSync('docker',['compose','restart','node-red'],{cwd:root,stdio:'inherit'});
let ready=false;
for(let i=0;i<60;i++){
    try{if((await fetch(base+'/api/info')).status===200){ready=true;break;}}catch{}
    await pause(1000);
}
assert.ok(ready,'Node-RED restarted');
const after=await observe('i12','d12');
assert.equal(after.payload.orderCount,before.payload.orderCount+1,'Counter persisted');
const file=await observe('i11-read','d11');
assert.equal(file.payload,original,'Old file read unchanged after restart');
const result={checkedAt:new Date().toISOString(),counterBefore:before.payload.orderCount,counterAfter:after.payload.orderCount,fileUnchanged:true,savedOrder:JSON.parse(original)};
await writeFile(new URL('docs/persistence-check.json',root),JSON.stringify(result,null,2)+'\n');
console.log('PASS: old file unchanged; persisted counter',result.counterBefore,'->',result.counterAfter);
