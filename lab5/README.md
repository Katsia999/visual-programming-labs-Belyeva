# Лабораторная работа 5 — чат-бот Typebot

Беляева Екатерина, СДП-ИИ-241. Трек C: self-hosted Typebot, шаблон Lead Generation.

## Запуск

1. Открыть Docker Desktop и дождаться работающего Engine.
2. В PowerShell выполнить:

```powershell
cd D:\VP_labs\visual-programming-labs-Belyeva\lab5
./start.ps1
```

3. Открыть [редактор Typebot](http://localhost:8080).
4. Для входа указать учебную почту. Ссылка входа приходит в [локальный почтовый ящик](http://localhost:8025). Письма перехватываются Mailpit на этом компьютере, наружу не отправляются.
5. Для демонстрации открыть [опубликованного бота](http://127.0.0.1:8081/lab5-belyeva-sdp-ii-241). Схема и три тестовые заявки уже сохранены в локальной установке.

Повторный запуск из Git Bash: `docker compose up -d`. Остановка с сохранением данных: `docker compose stop`. Логи: `docker compose logs --tail 50 builder viewer`.

База, результаты диалогов и секрет `.env` хранятся локально и исключены из Git. Редактор, viewer и почта опубликованы только на loopback компьютера. Внешний сервис времени нужен для HTTP Request; при его недоступности сценарий показывает отдельное сообщение.

## Материалы

- [Отчёт](docs/report.md)
- [Проверка требований](docs/checklist.md)
- [Промпты](docs/prompts.md)
- [Экспорты по этапам](exports/)

`template-lead-gen-original.json` — исходный официальный шаблон. `flow-01` — перевод, `flow-02` — переменные и условие, `flow-03` — интеграция и оформление. Итоговый экспорт из платформы сохраняется отдельно после проверки. `build-flow.mjs` воспроизводит подготовленные варианты; это вспомогательный инструмент, сам диалог выполняет Typebot.

Итоговый переносимый файл — `exports/flow-04-belyeva-export.json`. На другой установке создать workspace, выбрать Import a file, импортировать этот JSON и нажать Publish. В данной установке доступны [редактор схемы](http://localhost:8080/typebots/llfioldlul2uxwsjbpvh0pnb/edit) и [три сохранённых результата](http://localhost:8080/typebots/llfioldlul2uxwsjbpvh0pnb/results).

Проверка структуры: `node verify-exports.mjs exports/flow-04-belyeva-export.json`. Проверка результатов: `./verify-runtime.ps1`; она предназначена для этой установки с её ID бота и подготовленными тестовыми диалогами. Проверка сохранности: сначала выполнить проверку результатов, затем перезапустить контейнеры и выполнить `./verify-runtime.ps1 -AfterRestart`.

Источники: [установка Docker](https://docs.typebot.com/self-hosting/deploy/docker), [настройки Typebot](https://docs.typebot.com/self-hosting/configuration), [официальный шаблон Lead Generation](https://github.com/baptisteArno/typebot.io/blob/v3.19.1/packages/templates/src/typebots/lead-gen.json).
