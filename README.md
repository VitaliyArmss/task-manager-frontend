# Task Manager Frontend

React-клиент приложения Task Manager. Предоставляет пользовательский интерфейс для входа и работы с задачами, отправляя запросы в ASP.NET Core backend.

**[Открыть демо](https://vitaliyarmss.github.io/task-manager-frontend/)** · **[Backend](https://github.com/VitaliyArmss/task-manager-backend)** · **[Главный репозиторий](https://github.com/VitaliyArmss/task-manager-project)**

## Технологии

- React
- JavaScript
- Vite

## Локальный запуск

Требуются Node.js и npm.

```bash
npm install
npm run dev
```

Production-сборка:

```bash
npm run build
```

## Backend API

Frontend обращается к API по адресу:

```text
https://api.vitaliy-armss.ru/task-manager/api
```

Если адрес API нужно изменить, проверьте клиентский API-модуль в `src/` и согласуйте путь с конфигурацией Nginx и backend.

## Публикация

Приложение опубликовано через GitHub Pages:

**https://vitaliyarmss.github.io/task-manager-frontend/**

Для Vite настроен base path `/task-manager-frontend/` при production-сборке. При локальном запуске используется корневой путь `/`.

## Примечание по безопасности

Не помещайте секретные ключи, пароли PostgreSQL или другие backend-секреты во frontend: код и production-сборка доступны посетителям сайта.
