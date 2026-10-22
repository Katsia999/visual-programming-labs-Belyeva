# Требования лабораторной работы 4

Беляева Екатерина, СДП-ИИ-241. Основная часть без ачивки.

- Docker: образ n8nio/n8n, порт 5678, bind mounts /home/node/.n8n и /data.
- Регистрация локального владельца n8n.
- 01 Manual Trigger → Set → Code, payload с фамилией, topic lab4/belyeva/basic.
- 02 Manual Trigger → Code → NoOp: const/let, if/else, for, массив, объект, payload.
- 03 Manual Trigger → Code → IF → две NoOp; проверка обеих ветвей.
- 04 Manual Trigger → Set → Code: topic, текущий timestamp, payload, полный объект.
- 05 Manual Trigger → HTTP Request → Code: публичный GET API, JSON.
- 06 Schedule Trigger → Code: запуск раз в минуту и фактическое время.
- 09 Manual Trigger → Redis Set → Redis Get: ключ belyeva.
- 10 Manual Trigger → Redis Delete → проверка отсутствия ключа.
- Отдельные экспорты workflow и скриншоты выполнения.
- report.md, redis.md, примеры AI-промптов, выводы.
- Не менее шести осмысленных коммитов и push в GitHub.

В методичке есть расхождение нумерации в дереве и заданиях: используются имена из конкретных пунктов 2.1–2.6 и части 3. Поэтому файлы 07 и 08 не требуются.
