import fs from 'node:fs';
import { randomUUID } from 'node:crypto';

fs.mkdirSync(new URL('./flows/', import.meta.url), { recursive: true });
const student = 'Беляева';
const group = 'СДП-ИИ-241';
const node = (name, type, parameters, x, y = 300, typeVersion = 1) => ({
  id: randomUUID(), name, type: `n8n-nodes-base.${type}`, typeVersion,
  position: [x, y], parameters,
});
const manual = () => node('Manual Trigger', 'manualTrigger', {}, 240);
const code = (name, jsCode, x = 760) => node(name, 'code', { jsCode }, x, 300, 2);
const set = (name, values) => node(name, 'set', {
  assignments: { assignments: Object.entries(values).map(([name, value]) => ({ id: randomUUID(), name, value, type: 'string' })) },
  options: {},
}, 500, 300, 3.4);
const redis = (name, operation, extra, x) => ({
  ...node(name, 'redis', { operation, key: 'belyeva', ...extra }, x),
  credentials: { redis: { id: 'lab4-belyeva-redis', name: 'Redis Беляева СДП-ИИ-241' } },
});
function write(number, slug, title, nodes, edges) {
  const connections = {};
  for (const [from, to, output = 0] of edges) {
    connections[from] ??= { main: [] };
    while (connections[from].main.length <= output) connections[from].main.push([]);
    connections[from].main[output].push({ node: to, type: 'main', index: 0 });
  }
  const workflow = {
    id: `lab4Belyeva${number}`, name: `${number} ${title} — ${student} ${group}`,
    nodes, connections, active: false,
    settings: { executionOrder: 'v1', timezone: 'Europe/Minsk', saveManualExecutions: true, saveDataSuccessExecution: 'all', saveDataErrorExecution: 'all' },
    pinData: {}, versionId: randomUUID(), tags: [],
  };
  fs.writeFileSync(new URL(`./flows/flow-${number}-${slug}.json`, import.meta.url), JSON.stringify(workflow, null, 2) + '\n');
}
write('01', 'manual-set', 'Manual Set Code', [manual(), set('Set фамилия и topic', {
  payload: `${student}, ${group}`, topic: 'lab4/belyeva/basic',
}), code('Code Debug', 'return $input.all().map(item => { console.log(item.json); return { json: item.json }; });')],
[['Manual Trigger', 'Set фамилия и topic'], ['Set фамилия и topic', 'Code Debug']]);

const logic = `const student = { surname: '${student}', group: '${group}' };
const values = [20, 5, 10];
let total = 0;
for (let i = 0; i < values.length; i++) {
  total += values[i];
}
let level;
if (total >= 30) { level = 'high'; } else { level = 'low'; }
return [{ json: { payload: { ...student, values, total, level }, topic: 'lab4/belyeva/code' } }];`;
write('02', 'code', 'JavaScript и NoOp', [manual(), code('Code JavaScript', logic, 500), node('NoOp результат', 'noOp', {}, 800)],
[['Manual Trigger', 'Code JavaScript'], ['Code JavaScript', 'NoOp результат']]);

const branchLogic = `const student = { surname: '${student}', group: '${group}' };
const samples = [[20, 5, 10], [2, 5, 10]];
const result = [];
for (const values of samples) {
  let total = 0;
  for (const value of values) { total += value; }
  let level;
  if (total >= 30) { level = 'high'; } else { level = 'low'; }
  result.push({ json: { payload: { ...student, values, total, level } } });
}
return result;`;
write('03', 'if', 'IF две ветви', [manual(), code('Code два примера', branchLogic, 500),
  node('IF total >= 30', 'if', { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
    conditions: [{ id: randomUUID(), leftValue: '={{ $json.payload.total }}', rightValue: 30, operator: { type: 'number', operation: 'gte' } }], combinator: 'and' }, options: {} }, 760, 300, 2.2),
  node('NoOp true high', 'noOp', {}, 1020, 200), node('NoOp false low', 'noOp', {}, 1020, 420)],
[['Manual Trigger', 'Code два примера'], ['Code два примера', 'IF total >= 30'], ['IF total >= 30', 'NoOp true high', 0], ['IF total >= 30', 'NoOp false low', 1]]);

write('04', 'set', 'Set полный объект', [manual(), set('Set поля сообщения', {
  topic: 'lab4/belyeva/set', timestamp: '={{ $now.toISO() }}', payload: `${student}, ${group}`,
}), code('Code полный объект', 'return $input.all().map(item => { console.log(JSON.stringify(item.json)); return { json: { ...item.json } }; });')],
[['Manual Trigger', 'Set поля сообщения'], ['Set поля сообщения', 'Code полный объект']]);

write('05', 'http', 'HTTP GET JSON', [manual(), node('HTTP Request GET', 'httpRequest', {
  method: 'GET', url: 'https://official-joke-api.appspot.com/random_joke',
  options: { response: { response: { responseFormat: 'json' } }, timeout: 30000 },
}, 500, 300, 4.2), code('Code ответ API', `const response = $input.first().json;
if (typeof response.setup !== 'string' || typeof response.punchline !== 'string') {
  throw new Error('API вернул неожиданный формат');
}
return [{ json: { student: '${student}', group: '${group}', topic: 'lab4/belyeva/http', payload: response } }];`)],
[['Manual Trigger', 'HTTP Request GET'], ['HTTP Request GET', 'Code ответ API']]);

write('06', 'schedule', 'Расписание раз в минуту', [node('Schedule Trigger каждую минуту', 'scheduleTrigger', {
  rule: { interval: [{ field: 'minutes', minutesInterval: 1 }] },
}, 350, 300, 1.2), code('Code текущее время', `return [{ json: {
  student: '${student}', group: '${group}', topic: 'lab4/belyeva/schedule',
  timestamp: $now.toISO(), timezone: 'Europe/Minsk', trigger: $input.first().json
} }];`, 650)], [['Schedule Trigger каждую минуту', 'Code текущее время']]);

write('09', 'redis', 'Redis создание и чтение', [manual(), redis('Redis Set belyeva', 'set', {
  value: `${student}, ${group} — лабораторная 4`, keyType: 'string', expire: false,
}, 500), redis('Redis Get belyeva', 'get', { propertyName: 'value', keyType: 'string', options: {} }, 760)],
[['Manual Trigger', 'Redis Set belyeva'], ['Redis Set belyeva', 'Redis Get belyeva']]);

write('10', 'redis', 'Redis удаление и отсутствие', [manual(), redis('Redis Delete belyeva', 'delete', {}, 450),
  redis('Redis Get после удаления', 'get', { propertyName: 'value', keyType: 'string', options: {} }, 680),
  code('Code проверка отсутствия', `const value = $input.first().json.value;
if (value !== null) throw new Error('Ключ belyeva ещё существует');
return [{ json: { student: '${student}', group: '${group}', key: 'belyeva', value, exists: false, deleted: true } }];`, 920)],
[['Manual Trigger', 'Redis Delete belyeva'], ['Redis Delete belyeva', 'Redis Get после удаления'], ['Redis Get после удаления', 'Code проверка отсутствия']]);
console.log('Созданы 8 workflow');
