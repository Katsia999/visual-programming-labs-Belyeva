# GET API лабораторной работы 2

Базовый адрес: `http://localhost:1880`. Все запросы используют метод GET, тела запроса нет. У каждого маршрута отдельные ноды `http in` и `http response`.

## GET /api/text

Возвращает статус 200, `Content-Type: text/plain; charset=utf-8`.

```bash
curl -i 'http://localhost:1880/api/text'
```

Ответ: `Беляева СДП-ИИ-241 — лабораторная 2`.

## GET /api/info

Возвращает статус 200 и JSON с двумя полями:

```bash
curl -i 'http://localhost:1880/api/info'
```

```json
{"student":"Беляева","group":"СДП-ИИ-241"}
```

## GET /api/items

Возвращает меню из трёх блюд. Необязательный query-параметр `id` выбирает одно блюдо. Допускается положительное целое число без ведущих нулей. Параметр передаётся после `?`, Node-RED помещает его в `msg.req.query.id`.

```bash
curl -i 'http://localhost:1880/api/items'
curl -i 'http://localhost:1880/api/items?id=1'
curl -i 'http://localhost:1880/api/items?id=abc'
curl -i 'http://localhost:1880/api/items?id=99'
```

| Запрос | Статус | JSON ответа |
| --- | --- | --- |
| `/api/items` | 200 | `[{"id":1,"name":"Пицца"},{"id":2,"name":"Салат"},{"id":3,"name":"Суп"}]` |
| `/api/items?id=1` | 200 | `{"id":1,"name":"Пицца"}` |
| `/api/items?id=abc` | 400 | `{"error":"id должен быть положительным целым числом"}` |
| `/api/items?id=99` | 404 | `{"error":"Блюдо не найдено"}` |

Все ответы этого маршрута имеют `Content-Type: application/json; charset=utf-8`. Пустой `id`, ноль, отрицательное или дробное число также дают 400. Правильное число, которого нет в меню, даёт 404. Состав меню задан массивом в Function, база данных не используется.
