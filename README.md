# QR Code Generator

Full-stack веб-приложение для генерации, управления и аналитики QR-кодов. Построено с использованием **Next.js 15**, **Prisma** и **PostgreSQL**.

## 🚀 Инструкция по запуску

Проект может быть запущен двумя способами: локально для разработки или через Docker Compose.

### Предварительные требования

Перед началом работы убедитесь, что у вас установлены:
- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) (версия 20.x или выше)
- [npm](https://www.npmjs.com/) (идет вместе с Node.js)
- [Docker](https://www.docker.com/) и **Docker Compose** (для запуска через контейнеры)
- Аккаунт и API-ключ от [Hovercode API](https://hovercode.com/)

---

### Шаг 1. Клонирование репозитория

Для начала склонируйте проект на свой компьютер и перейдите в его директорию:

```bash
git clone https://github.com/bborutenko/qr-code-generator.git
cd qr-code-generator
```

### Шаг 2. Настройка переменных окружения

В корневой директории проекта создайте файл `.env`. Вы можете использовать `.env.example` как шаблон:

```bash
cp .env.example .env
```

Откройте файл `.env` и заполните ваши конфигурационные данные. Ниже представлена таблица с описанием конфигурационных переменных:

| Имя переменной | Описание | Пример значения |
| :--- | :--- | :--- |
| `HOVERCODE_WORKSPACE_ID` | Уникальный ID вашего рабочего пространства (Workspace) в системе Hovercode. | `03fd6cf1-5dc2-4ae3-9e27...` |
| `HOVERCODE_API_KEY` | Приватный API ключ для совершения запросов к сервису Hovercode. | `a005619f7c664425b02...` |
| `HOVERCODE_BASE_URL` | Базовый URL для запросов. (Обычно остается неизменным) | `https://hovercode.com/api/v2` |
| `DATABASE_URL` | Полная строка подключения Prisma к базе данных. *Должна содержать хост, порт, имя БД, логин и пароль.* | `postgresql://main:pass@postgres:5432/qr_code_gen` |
| `DB_NAME` | Название базы данных (используется сборщиком Docker Compose для создания БД). | `qr_code_gen` |
| `DB_USER` | Имя пользователя базы данных PostgreSQL. | `main` |
| `DB_PASSWORD` | Пароль пользователя базы данных. *Должен совпадать с паролем в `DATABASE_URL`*. | `your_secure_password` |

**Важно:** Для локальной разработки без Docker укажите хост `localhost`, а для запуска в Docker используйте внутреннее имя сервиса `postgres` в строке подключения `DATABASE_URL`:
```env
# Для Docker:
DATABASE_URL="postgresql://main:your_password@postgres:5432/qr_code_gen"

# Для локального запуска:
# DATABASE_URL="postgresql://main:your_password@localhost:5432/qr_code_gen"
```

---

### Вариант А: Запуск с использованием Docker (Рекомендуемый для продакшена)

Этот способ автоматически поднимет базу данных PostgreSQL и сервер приложения в контейнерах.

1. **Соберите и запустите контейнеры:**
   ```bash
   sudo docker compose --env-file .env -f docker/docker-compose.yml up -d --build
   ```

2. **Примените миграции базы данных:**
   Поскольку база данных создается пустой, вам необходимо создать таблицы Prisma внутри контейнера приложения:
   ```bash
   sudo docker exec -it qr-code-generator-app npx prisma db push
   ```

3. **Откройте приложение:**
   Перейдите в браузере по адресу: [http://localhost:3000](http://localhost:3000)

---

### Вариант Б: Локальный запуск (Для разработки)

Если вы хотите вносить изменения в код, удобнее запускать приложение локально. Вам всё равно потребуется база данных (например, запуская только контейнер Postgres, или имея БД установленную локально).

1. **Установите зависимости:**
   ```bash
   npm install
   ```

2. **Создайте и обновите базу данных:**
   Убедитесь, что база данных запущена локально на порту `5432` и создайте таблицы:
   ```bash
   npx prisma db push
   ```
   *(Также сгенерируйте Prisma-клиент, если это не произошло автоматически: `npx prisma generate`)*

3. **Запустите сервер разработки:**
   ```bash
   npm run dev
   ```

4. **Откройте приложение:**
   Перейдите в браузере по адресу: [http://localhost:3000](http://localhost:3000)

---

### Дополнительные команды

- Остановка Docker-контейнеров:
  ```bash
  sudo docker compose -f docker/docker-compose.yml down
  ```
- Остановка контейнеров вместе с удалением данных базы (очистка volume):
  ```bash
  sudo docker compose -f docker/docker-compose.yml down -v
  ```

