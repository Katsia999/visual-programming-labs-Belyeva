import fs from 'node:fs';
import assert from 'node:assert/strict';

const root = new URL('./', import.meta.url);
const cookies = JSON.parse(fs.readFileSync(new URL('runtime/session.json', root), 'utf8').replace(/^\uFEFF/, ''));
const cookie = cookies.map(c => `${c.name}=${c.value}`).join('; ');
async function api(path, method = 'GET', body) {
  const response = await fetch(`http://localhost:5678/rest/${path}`, {
    method, headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`${method} ${path}: ${JSON.stringify(data)}`);
  return data.data;
}
// n8n serializes execution data with flatted references. Decode only locally;
// publish selected node outputs, never runtime credentials or session tokens.
function unflatten(source) {
  if (typeof source !== 'string') return source;
  const values = JSON.parse(source);
  const visited = new Map();
  function resolve(index) {
    if (visited.has(index)) return visited.get(index);
    const value = values[index];
    if (!value || typeof value !== 'object') return value;
    const result = Array.isArray(value) ? [] : {};
    visited.set(index, result);
    for (const [key, item] of Object.entries(value)) result[key] = typeof item === 'string' ? resolve(Number(item)) : item;
    return result;
  }
  return resolve(0);
}
{
  const list = await api('executions?limit=100');
  const records = [];
  for (const number of ['01', '02', '03', '04', '05', '06', '09', '10']) {
    const execution = list.results.find(e => e.workflowId === `lab4Belyeva${number}` && e.status === 'success' && (number !== '06' || e.mode === 'trigger'));
    assert.ok(execution, `Нет успешного выполнения ${number}`);
    const detail = await api(`executions/${execution.id}`);
    const data = unflatten(detail.data);
    const nodes = {};
    for (const [name, runs] of Object.entries(data.resultData.runData)) {
      nodes[name] = runs.map(run => ({ status: run.executionStatus, outputs: run.data?.main?.map(items => items.map(item => item.json)) }));
    }
    const allOutputs = Object.values(nodes).flatMap(runs => runs.flatMap(run => run.outputs?.flat() ?? []));
    if (number === '01') assert.ok(allOutputs.some(o => o.topic === 'lab4/belyeva/basic' && o.payload.includes('Беляева')));
    if (number === '02') assert.ok(allOutputs.some(o => o.payload?.total === 35));
    if (number === '03') {
      assert.equal(nodes['NoOp true high'][0].outputs[0][0].payload.total, 35);
      assert.equal(nodes['NoOp false low'][0].outputs[0][0].payload.total, 17);
    }
    if (number === '04') assert.ok(allOutputs.some(o => o.timestamp && o.topic === 'lab4/belyeva/set'));
    if (number === '05') assert.ok(allOutputs.some(o => typeof o.payload?.setup === 'string'));
    if (number === '06') assert.ok(allOutputs.some(o => o.timezone === 'Europe/Minsk' && o.timestamp));
    if (number === '09') assert.ok(allOutputs.some(o => typeof o.value === 'string' && o.value.includes('Беляева')));
    if (number === '10') assert.ok(allOutputs.some(o => o.value === null && o.exists === false && o.deleted === true));
    records.push({ workflow: number, executionId: execution.id, mode: execution.mode, status: execution.status, startedAt: execution.startedAt, stoppedAt: execution.stoppedAt, nodes });
  }
  fs.writeFileSync(new URL('docs/verification.json', root), JSON.stringify({ checkedAt: new Date().toISOString(), allPassed: true, executions: records }, null, 2) + '\n');
  console.log('Проверены 8 workflow, обе ветви IF, публичный API, автоматическое расписание и Redis');
}
