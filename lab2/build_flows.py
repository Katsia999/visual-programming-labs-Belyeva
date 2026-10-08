"""Build importable Node-RED flows and the local runtime flow file."""
import json
from pathlib import Path

BASE = Path(__file__).resolve().parent
GROUP = 'СДП-ИИ-241'
all_nodes = []

def save(num, slug, title, nodes):
    tab = f'lab2-{num:02}'
    for node in nodes:
        if 'x' in node:
            node['z'] = tab
    data = [dict(id=tab, type='tab', label=f'{num:02} {title} — Беляева {GROUP}', disabled=False, info='Лабораторная работа 2'), *nodes]
    (BASE / 'flows').mkdir(exist_ok=True)
    (BASE / 'flows' / f'flow-{num:02}-{slug}.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    all_nodes.extend(data)

def n(id, type, name, x, y, wires=None, **kw):
    return dict(id=id, type=type, name=name, x=x, y=y, wires=wires or [], **kw)

def inj(id, target, payload='Беляева', pt='str', repeat='', y=120, topic='lab2/belyeva/basic'):
    return n(id, 'inject', f'Беляева {GROUP}', 170, y, [[target]], props=[{'p':'payload'}, {'p':'topic','vt':'str'}], payload=payload, payloadType=pt, topic=topic, repeat=repeat, crontab='', once=False, onceDelay=0.1)

def dbg(id, y=120, x=820):
    return n(id, 'debug', id, x, y, active=True, tosidebar=True, console=False, tostatus=False, complete='true', targetType='full')

def fun(id, target, code, x=430, y=120, name='Обработка данных'):
    return n(id, 'function', name, x,y,[[target]],func=code,outputs=1,noerr=0,initialize='',finalize='',libs=[])

calc = "const values = [Number(msg.payload), 5, 10];\nlet total = 0;\nfor (let i = 0; i < values.length; i++) { total += values[i]; }\nlet level;\nif (total >= 30) { level = 'high'; } else { level = 'low'; }\nconst result = {student: 'Беляева', group: 'СДП-ИИ-241', total, level};\nmsg.payload = result;\nreturn msg;"
save(1,'inject-debug','Inject и Debug',[inj('i01','d01',repeat='5'),dbg('d01')])
save(2,'function','Function',[inj('i02','f02','20','num'),fun('f02','d02',calc),dbg('d02')])
save(3,'switch','Switch',[inj('i03','f03','20','num'),inj('i03-low','f03','2','num',y=200),fun('f03','s03',calc),n('s03','switch','Сумма >= 30?',640,120,[['d03-high'],['d03-low']],property='payload.total',propertyType='msg',rules=[{'t':'gte','v':'30','vt':'num'},{'t':'lt','v':'30','vt':'num'}],checkall='true',repair=False,outputs=2),dbg('d03-high',80,880),dbg('d03-low',200,880)])
save(4,'change','Change',[inj('i04','c04'),n('c04','change','Задать topic, timestamp, payload',470,120,[['d04']],rules=[{'t':'set','p':'topic','pt':'msg','to':'lab2/belyeva/change','tot':'str'},{'t':'set','p':'timestamp','pt':'msg','to':'','tot':'date'},{'t':'set','p':'payload','pt':'msg','to':'Беляева СДП-ИИ-241 — Change','tot':'str'}],action='',property='',from_='',to='',reg=False),dbg('d04')])
save(5,'template','Mustache',[inj('i05','t05',json.dumps({'student':'Беляева','group':GROUP,'subject':'Node-RED'},ensure_ascii=False),'json'),n('t05','template','Сообщение Mustache',470,120,[['d05']],field='payload',fieldType='msg',format='handlebars',syntax='mustache',template='Студентка {{payload.student}}, группа {{payload.group}} изучает {{payload.subject}}.',output='str'),dbg('d05')])
save(6,'http-request','HTTP Request',[inj('i06','h06'),n('h06','http request','GET catfacts.ninja/fact',470,120,[['d06']],method='GET',ret='obj',paytoqs='ignore',url='https://catfacts.ninja/fact',tls='',persist=False,proxy='',insecureHTTPParser=False,authType='',senderr=False,headers=[]),dbg('d06')])

def mqtt(num,local):
    topic=f'student/belyeva/lab2/{"local" if local else "temperature"}'
    broker=f'broker{num}'
    return [inj(f'i{num}',f'f{num}',repeat='5',topic=topic),fun(f'f{num}',f'out{num}',"msg.payload = Math.round((18 + Math.random() * 12) * 10) / 10;\nreturn msg;",name='Случайная температура'),n(f'out{num}','mqtt out',topic,820,120,topic=topic,qos='1',retain='false',respTopic='',contentType='',userProps='',correl='',expiry='',broker=broker),n(f'in{num}','mqtt in',topic,300,260,[[f'd{num}']],topic=topic,qos='1',datatype='auto-detect',broker=broker,nl=False,rap=True,rh=0,inputs=0),dbg(f'd{num}',260),dict(id=broker,type='mqtt-broker',name='Локальный Mosquitto' if local else 'Публичный HiveMQ',broker='mosquitto' if local else 'broker.hivemq.com',port='1883',clientid=f'belyeva-lab2-{num}',autoConnect=True,usetls=False,protocolVersion='4',keepalive='60',cleansession=True,autoUnsubscribe=True,birthTopic='',birthQos='0',birthPayload='',closeTopic='',closeQos='0',closePayload='',willTopic='',willQos='0',willPayload='')]
save(7,'mqtt','Публичный MQTT',mqtt(7,False))
routes=[]
for idx,path,code in [
    (1,'/api/text',"msg.headers = {'Content-Type':'text/plain; charset=utf-8'}; msg.payload = 'Беляева СДП-ИИ-241 — лабораторная 2'; return msg;"),
    (2,'/api/info',"msg.headers = {'Content-Type':'application/json; charset=utf-8'}; msg.payload = {student:'Беляева',group:'СДП-ИИ-241'}; return msg;"),
    (3,'/api/items',"const items = [{id:1,name:'Пицца'},{id:2,name:'Салат'},{id:3,name:'Суп'}];\nconst id = msg.req.query.id;\nmsg.headers = {'Content-Type':'application/json; charset=utf-8'};\nif (id === undefined) { msg.payload = items; }\nelse if (!/^[1-9][0-9]*$/.test(String(id))) { msg.statusCode = 400; msg.payload = {error:'id должен быть положительным целым числом'}; }\nelse { const item = items.find(item => item.id === Number(id)); if (item) { msg.payload = item; } else { msg.statusCode = 404; msg.payload = {error:'Блюдо не найдено'}; } }\nreturn msg;")]:
    y=idx*100
    routes.extend([n(f'h08-{idx}','http in',f'GET {path}',180,y,[[f'f08-{idx}']],url=path,method='get',upload=False,swaggerDoc=''),fun(f'f08-{idx}',f'r08-{idx}',code,y=y,name='Ответ и проверка параметров'),n(f'r08-{idx}','http response','HTTP ответ',800,y,statusCode='',headers={})])
save(8,'endpoints','GET API',routes)
save(9,'dashboard','Dashboard',[inj('i09','f09',repeat='5'),fun('f09','g09',"msg.payload = Math.round((18 + Math.random() * 12) * 10) / 10;\nmsg.topic = 'Беляева СДП-ИИ-241';\nreturn msg;",name='Датчик температуры'),n('g09','ui_gauge','Температура',750,90,group='ui-group',order=1,width=6,height=4,gtype='gage',title='Температура',label='°C',format='{{value}}',min=0,max=40,colors=['#00b500','#e6e600','#ca3838'],seg1='',seg2='',diff=False,className=''),n('chart09','ui_chart','История температуры',750,220,[[]],group='ui-group',order=2,width=12,height=5,label='Температура во времени',chartType='line',legend='true',xformat='HH:mm:ss',interpolate='linear',nodata='Ожидание датчика',dot=True,ymin='0',ymax='40',removeOlder='10',removeOlderPoints='',removeOlderUnit='60',cutout=0,useOneColor=False,useUTC=False,colors=['#1f77b4'],outputs=1,useDifferentColor=False,className=''),dict(id='ui-group',type='ui_group',name=f'Датчик — Беляева {GROUP}',tab='ui-tab',order=1,disp=True,width='12',collapse=False,className=''),dict(id='ui-tab',type='ui_tab',name=f'Беляева {GROUP}',icon='dashboard',disabled=False,hidden=False)])
# Send the same sensor reading to both widgets.
all_nodes[next(i for i,v in enumerate(all_nodes) if v['id']=='f09')]['wires']=[['g09','chart09']]
p=BASE/'flows'/'flow-09-dashboard.json'
data=json.loads(p.read_text(encoding='utf-8'))
next(v for v in data if v['id']=='f09')['wires']=[['g09','chart09']]
p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
save(10,'telegram','Telegram бот',[n('recv10','telegram receiver','Сообщения боту',190,120,[['f10'],['d10']],bot='bot10',saveDataDir='',filterCommands=False),fun('f10','send10',"if (!msg.payload || msg.payload.type !== 'message') return null;\nconst text = String(msg.payload.content || '');\nconst command = text.split(/\\s+/)[0].split('@')[0];\nlet reply;\nif (command === '/start') { reply = 'Привет! Я бот Беляевой, СДП-ИИ-241. Команда /info расскажет о лабораторной. Остальные сообщения я повторяю.'; }\nelse if (command === '/info') { reply = 'Лабораторная №2: Node-RED. Беляева, СДП-ИИ-241. Ачивка №1 — локальный MQTT.'; }\nelse { reply = 'Эхо: ' + text; }\nmsg.payload = {chatId:msg.payload.chatId,type:'message',content:reply};\nreturn msg;",name='/start, /info и echo'),n('send10','telegram sender','Ответ бота',780,120,[['d10'],['d10']],bot='bot10',haserroroutput=True,outputs=2),dbg('d10',260),dict(id='bot10',type='telegram bot',botname='tvl_lab2_belyeva_bot',usernames='',chatids='',baseapiurl='',testenvironment=False,updatemode='polling',pollinterval='300',addressfamily='4',usesocks=False,verboselogging=False)])
save(11,'files','Файлы',[inj('i11-write','f11'),fun('f11','write11',"msg.payload = JSON.stringify({student:'Беляева',group:'СДП-ИИ-241',createdAt:new Date().toISOString(),order:'Пицца'},null,2);\nreturn msg;",name='Запись заказа в JSON'),n('write11','file','Сохранить /data/order.json',800,120,[['d11']],filename='/data/order.json',filenameType='str',appendNewline=False,createDir=True,overwriteFile='true',encoding='utf8'),inj('i11-read','read11',y=260),n('read11','file in','Прочитать /data/order.json',470,260,[['d11']],filename='/data/order.json',filenameType='str',format='utf8',chunk=False,sendError=False,encoding='utf8',allProps=False),dbg('d11',260)])
save(12,'context','Контекст',[inj('i12','f12'),fun('f12','d12',"let count = flow.get('orderCount') || 0;\ncount += 1;\nflow.set('orderCount',count);\nmsg.payload = {student:'Беляева',group:'СДП-ИИ-241',orderCount:count};\nreturn msg;",name='Счётчик заказов в flow context'),dbg('d12')])
save(13,'local-mqtt','Ачивка 1 — локальный MQTT',mqtt(13,True))
runtime=BASE/'runtime'/'node-red'
runtime.mkdir(parents=True,exist_ok=True)
(runtime/'flows.json').write_text(json.dumps(all_nodes,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(runtime/'settings.js').write_text((BASE/'settings.js').read_text(encoding='utf-8'),encoding='utf-8')
(BASE/'runtime'/'mosquitto').mkdir(parents=True,exist_ok=True)
(BASE/'screenshots').mkdir(exist_ok=True)
print(f'Created 13 flows, {len(all_nodes)} nodes')
