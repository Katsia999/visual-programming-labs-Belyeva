\# Sequence Diagram



```mermaid

sequenceDiagram

&#x20;   participant Client as Клиент

&#x20;   participant App as Приложение

&#x20;   participant Restaurant as Ресторан

&#x20;   participant Payment as Платёжная система

&#x20;   participant Courier as Курьер



&#x20;   Client->>App: Выбирает ресторан и блюда

&#x20;   Client->>App: Оформляет заказ

&#x20;   App->>Restaurant: Отправляет заказ

&#x20;   Restaurant-->>App: Результат проверки наличия блюд



&#x20;   alt Блюда недоступны

&#x20;       App-->>Client: Уведомление об отсутствии блюда

&#x20;       alt Клиент изменяет заказ

&#x20;           Client->>App: Изменяет заказ

&#x20;           App->>Restaurant: Повторно отправляет заказ

&#x20;           Restaurant-->>App: Подтверждает наличие

&#x20;       else Клиент отменяет заказ

&#x20;           Client->>App: Отменяет заказ

&#x20;           App-->>Client: Подтверждение отмены

&#x20;       end

&#x20;   else Блюда доступны

&#x20;       App-->>Client: Предлагает перейти к оплате

&#x20;       Client->>Payment: Выполняет оплату

&#x20;       Payment-->>App: Результат оплаты



&#x20;       alt Оплата неуспешна

&#x20;           App-->>Client: Сообщение об ошибке оплаты

&#x20;           Client->>Payment: Повторяет оплату

&#x20;           Payment-->>App: Успешная оплата

&#x20;       else Оплата успешна

&#x20;           App-->>Restaurant: Подтверждение заказа

&#x20;       end



&#x20;       par Подготовка заказа

&#x20;           Restaurant->>Restaurant: Готовит еду

&#x20;           Restaurant->>Restaurant: Упаковывает заказ

&#x20;           Restaurant-->>App: Заказ готов к выдаче

&#x20;       and Поиск курьера

&#x20;           App->>Courier: Назначает доставку

&#x20;           Courier-->>App: Подтверждает принятие заказа

&#x20;       end



&#x20;       Courier->>Restaurant: Прибывает в ресторан

&#x20;       Restaurant-->>Courier: Передаёт заказ

&#x20;       Courier->>Client: Доставляет заказ

&#x20;       Client-->>App: Подтверждает получение

&#x20;       App-->>Client: Завершает заказ и предлагает оставить отзыв

&#x20;   end

```

