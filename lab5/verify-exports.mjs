import fs from 'node:fs';
import assert from 'node:assert/strict';

const file = process.argv[2] ?? new URL('./exports/flow-03-belyeva-final.json', import.meta.url);
const bot = JSON.parse(fs.readFileSync(file));
const groups = new Map(bot.groups.map(g=>[g.id,g]));
const blocks = new Map(bot.groups.flatMap(g=>g.blocks).map(b=>[b.id,b]));
const variables = new Set(bot.variables.map(v=>v.id));
const edges = new Map(bot.edges.map(e=>[e.id,e]));
const knownNames = new Set(bot.variables.map(v=>v.name));
for(const edge of bot.edges) {
  assert(groups.has(edge.to.groupId),`Нет группы назначения: ${edge.id}`);
  if(edge.from.blockId) assert(blocks.has(edge.from.blockId),`Нет исходного блока: ${edge.id}`);
}
function walk(value) {
  if(Array.isArray(value)) return value.forEach(walk);
  if(value && typeof value==='object') {
    for(const [key,v] of Object.entries(value)) {
      if(key==='variableId'&&v) assert(variables.has(v),`Неизвестная переменная ${v}`);
      if(key==='outgoingEdgeId'&&v) assert(edges.has(v),`Нет перехода ${v}`);
      walk(v);
    }
  } else if(typeof value==='string') {
    for(const match of value.matchAll(/\{\{([^}]+)\}\}/g)) assert(knownNames.has(match[1]),`Неверная подстановка ${match[1]}`);
  }
}
walk(bot);
const reached=new Set();
const queue=bot.events.map(e=>edges.get(e.outgoingEdgeId)?.to.groupId).filter(Boolean);
while(queue.length) {
  const id=queue.shift(); if(reached.has(id)) continue; reached.add(id);
  for(const block of groups.get(id).blocks) {
    for(const edgeId of [block.outgoingEdgeId,...(block.items??[]).map(i=>i.outgoingEdgeId)].filter(Boolean)) queue.push(edges.get(edgeId).to.groupId);
  }
}
assert.equal(reached.size,groups.size,'В схеме есть недостижимые группы');
assert(bot.groups.flatMap(g=>g.blocks).some(b=>b.type==='Webhook'),'Отсутствует HTTP Request');
assert(bot.groups.flatMap(g=>g.blocks).some(b=>b.type==='Condition'),'Отсутствует Condition');
console.log(JSON.stringify({staticValidationPassed:true,groups:groups.size,blocks:blocks.size,variables:variables.size,edges:edges.size,reachableGroups:reached.size},null,2));
