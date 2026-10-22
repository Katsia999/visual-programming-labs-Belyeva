import fs from 'node:fs';

const bot = JSON.parse(fs.readFileSync(new URL('./exports/template-lead-gen-original.json', import.meta.url)));
const text = value => ({ richText: [{ type: 'p', children: [{ text: value }] }] });
const groups = Object.fromEntries(bot.groups.map(g => [g.title, g]));
const messages = {
  Welcome: ['Здравствуйте! Это бот Беляевой Екатерины, СДП-ИИ-241. Помогу оформить заявку на консультацию по лабораторным.'],
  Name: ['Как к вам обращаться?'],
  Email: ['Рада знакомству, {{Имя}}!', 'Укажите учебную почту для ответа. Для проверки можно использовать адрес на example.com.'],
  Services: ['По какой теме нужна консультация?'],
  'Additional information': ['Опишите вопрос и укажите номер лабораторной.'],
  Bye: ['Заявка сохранена в результатах бота.', '{{Имя}}, тема: {{Тема}}. Почта для ответа: {{Почта}}. Это учебная демонстрация: письмо и уведомление преподавателю не отправляются.'],
};
const titles = { Welcome: '01 Приветствие Беляева', Name: '02 Имя', Email: '03 Почта', Services: '04 Тема консультации', 'Additional information': '05 Вопрос', Bye: '06 Итог заявки' };
for (const [oldTitle, group] of Object.entries(groups)) {
  let i = 0;
  group.title = titles[oldTitle];
  group.blocks = group.blocks.filter(b => b.type !== 'image');
  for (const block of group.blocks) {
    if (block.type === 'text') block.content = text(messages[oldTitle][i++]);
    if (block.type === 'text input' || block.type === 'email input') {
      block.options ??= {};
      block.options.labels = { placeholder: oldTitle === 'Name' ? 'Например, Екатерина Беляева' : oldTitle === 'Email' ? 'Например, belyeva@example.com' : 'Ваш вопрос по лабораторной', button: 'Продолжить' };
      if (block.type === 'email input') block.options.retryMessageContent = 'Введите корректную почту, например belyeva@example.com.';
    }
  }
}
groups.Welcome.blocks.find(b => b.type === 'choice input').items[0].content = 'Начать заявку';
const topics = groups.Services.blocks.find(b => b.type === 'choice input');
['Node-RED и MQTT', 'Bubble и CRUD', 'n8n и Redis', 'Typebot и чат-боты'].forEach((s,i) => topics.items[i].content = s);
bot.variables[0].name = 'Имя';
bot.variables[1].name = 'Почта';
bot.variables.push({ id: 'varbelyevatopic', name: 'Тема', isSessionVariable: true }, { id: 'varbelyevaquestion', name: 'Вопрос', isSessionVariable: true });
topics.options = { variableId: 'varbelyevatopic' };
groups['Additional information'].blocks.find(b => b.type === 'text input').options.variableId = 'varbelyevaquestion';
bot.name = 'lab5-Беляева-СДП-ИИ-241-консультация';
bot.settings = {
  general: {
    isBrandingEnabled: true,
    isNewResultOnRefreshEnabled: true,
    systemMessages: {
      invalidMessage: 'Проверьте введённые данные и попробуйте ещё раз.',
      botClosed: 'Бот сейчас закрыт.',
      networkErrorTitle: 'Ошибка соединения',
      networkErrorMessage: 'Проверьте соединение и повторите попытку.',
      popupBlockedTitle: 'Окно заблокировано',
      popupBlockedDescription: 'Разрешите открыть окно, чтобы продолжить.',
      popupBlockedButtonLabel: 'Открыть окно',
      fileUploadError: 'Не удалось загрузить файл.',
      fileUploadSizeError: 'Файл слишком большой.',
      whatsAppPictureChoiceSelectLabel: 'Выбрать',
    },
  },
  typingEmulation: { enabled: false },
  metadata: { title: 'Консультация по лабораторным — Беляева', description: 'Учебный чат-бот Беляевой Екатерины, СДП-ИИ-241. Заявка на консультацию по визуальному программированию.', allowIndexing: false },
};
for (const k of ['id','workspaceId','folderId','createdAt','updatedAt','publicId','customDomain','resultsTablePreferences','whatsAppCredentialsId']) delete bot[k];
fs.writeFileSync(new URL('./exports/flow-01-belyeva-ru.json', import.meta.url), JSON.stringify(bot,null,2)+'\n');
console.log('Сохранён перевод официального шаблона Lead Generation.');

const addText = (id, value) => ({ id, type: 'text', content: text(value) });
const connect = (id, blockId, groupId, itemId) => {
  bot.edges.push({ id, from: { blockId, ...(itemId ? { itemId } : {}) }, to: { groupId } });
};
bot.variables.push(...[
  ['varbelyevagroup','Группа'], ['varbelyevaroute','Маршрут'],
].map(([id,name]) => ({ id,name,isSessionVariable:true })));
// Вставляем новые шаги между именем и почтой, сохраняя исходные блоки шаблона.
bot.edges.find(e => e.id === '4tYbERpi5Po4goVgt6rWXg').to.groupId = 'groupbelyevastudent';
bot.groups.push(
  { id:'groupbelyevastudent', title:'02а Учебная группа', graphCoordinates:{x:340,y:490}, blocks:[
    addText('blockbelyevagroupask','Укажите вашу группу. Например, СДП-ИИ-241.'),
    {id:'blockbelyevagroupinput',type:'text input',outgoingEdgeId:'edgebelyevacheck',options:{variableId:'varbelyevagroup',labels:{placeholder:'Например, СДП-ИИ-241',button:'Проверить группу'}}},
  ]},
  { id:'groupbelyevacondition',title:'02б Проверка группы',graphCoordinates:{x:680,y:490},blocks:[
    {id:'blockbelyevacondition',type:'Condition',outgoingEdgeId:'edgebelyevaother',items:[
      {id:'itembelyevamatch',outgoingEdgeId:'edgebelyevamatch',content:{comparisons:[{id:'comparisonbelyeva',variableId:'varbelyevagroup',comparisonOperator:'Equal to',value:'СДП-ИИ-241'}]}}
    ]}
  ]},
  {id:'groupbelyevasame',title:'02в Своя группа',graphCoordinates:{x:1020,y:490},blocks:[
    addText('blockbelyevasame','Вы из группы СДП-ИИ-241. Подготовим консультацию по нашей программе.'),
    {id:'blockbelyevasameroute',type:'Set variable',outgoingEdgeId:'edgebelyevasameemail',options:{variableId:'varbelyevaroute',expressionToEvaluate:'Своя группа'}}
  ]},
  {id:'groupbelyevaother',title:'02г Другая группа',graphCoordinates:{x:1020,y:810},blocks:[
    addText('blockbelyevaother','Вы указали другую группу: {{Группа}}. Заявку тоже можно оставить; укажите в вопросе свою учебную программу.'),
    {id:'blockbelyevaotherroute',type:'Set variable',outgoingEdgeId:'edgebelyevaotheremail',options:{variableId:'varbelyevaroute',expressionToEvaluate:'Другая группа'}}
  ]}
);
connect('edgebelyevacheck','blockbelyevagroupinput','groupbelyevacondition');
connect('edgebelyevamatch','blockbelyevacondition','groupbelyevasame','itembelyevamatch');
connect('edgebelyevaother','blockbelyevacondition','groupbelyevaother');
connect('edgebelyevasameemail','blockbelyevasameroute',groups.Email.id);
connect('edgebelyevaotheremail','blockbelyevaotherroute',groups.Email.id);
fs.writeFileSync(new URL('./exports/flow-02-belyeva-condition.json',import.meta.url),JSON.stringify(bot,null,2)+'\n');
console.log('Добавлены ввод группы, Condition и две ветви.');

bot.variables.push({id:'varbelyevatime',name:'Время Минска',isSessionVariable:true});
bot.edges.find(e=>e.id==='sH5nUssG2XQbm6ZidGv9BY').to.groupId='groupbelyevahttp';
bot.groups.push(
  {id:'groupbelyevahttp',title:'07 HTTP время Минска',graphCoordinates:{x:1340,y:490},blocks:[
    addText('blockbelyevahttptxt','Получаю текущее время Минска через публичный API. Ваши имя, группа, почта и вопрос в этот запрос не передаются.'),
    {id:'blockbelyevahttp',type:'Webhook',outgoingEdgeId:'edgebelyevatimecheck',options:{
      timeout:15,
      webhook:{method:'GET',url:'https://timeapi.io/api/time/current/zone?timeZone=Europe/Minsk'},
      responseVariableMapping:[{id:'mappingbelyevatime',variableId:'varbelyevatime',bodyPath:'data.dateTime'}]
    }}
  ]},
  {id:'groupbelyevatimecheck',title:'08 Ответ API получен',graphCoordinates:{x:1680,y:490},blocks:[
    {id:'blockbelyevatimecheck',type:'Condition',outgoingEdgeId:'edgebelyevatimefail',items:[{id:'itembelyevatimeok',outgoingEdgeId:'edgebelyevatimeok',content:{comparisons:[{id:'comparisonbelyevatime',variableId:'varbelyevatime',comparisonOperator:'Is set'}]}}]}
  ]},
  {id:'groupbelyevatimeok',title:'09 Время получено',graphCoordinates:{x:2020,y:490},blocks:[
    {...addText('blockbelyevatimeok','Время Минска по данным API: {{Время Минска}}.'),outgoingEdgeId:'edgebelyevaokbye'}
  ]},
  {id:'groupbelyevatimefail',title:'10 API недоступен',graphCoordinates:{x:2020,y:800},blocks:[
    {...addText('blockbelyevatimefail','Сервис времени сейчас недоступен. Это не мешает сохранить вашу заявку.'),outgoingEdgeId:'edgebelyevafailbye'}
  ]}
);
connect('edgebelyevatimecheck','blockbelyevahttp','groupbelyevatimecheck');
connect('edgebelyevatimeok','blockbelyevatimecheck','groupbelyevatimeok','itembelyevatimeok');
connect('edgebelyevatimefail','blockbelyevatimecheck','groupbelyevatimefail');
connect('edgebelyevaokbye','blockbelyevatimeok',groups.Bye.id);
connect('edgebelyevafailbye','blockbelyevatimefail',groups.Bye.id);
groups.Bye.graphCoordinates={x:2360,y:490};
groups.Bye.blocks.push(addText('blockbelyevasummary','Группа: {{Группа}}. Маршрут: {{Маршрут}}. Вопрос: {{Вопрос}}. Спасибо за обращение!'));
bot.theme={general:{font:'Arial',background:{type:'Color',content:'#F0F6F2'}},chat:{
  hostBubbles:{backgroundColor:'#FFFFFF',color:'#18392B'},guestBubbles:{backgroundColor:'#226747',color:'#FFFFFF'},
  buttons:{backgroundColor:'#226747',color:'#FFFFFF'},inputs:{backgroundColor:'#FFFFFF',color:'#18392B',placeholderColor:'#64786B'},
  buttonsInput:{layout:'vertical'},roundness:'large'
}};
bot.icon='🎓';
fs.writeFileSync(new URL('./exports/flow-03-belyeva-final.json',import.meta.url),JSON.stringify(bot,null,2)+'\n');
console.log('Добавлены HTTP Request, обработка ошибки и зелёная тема.');
