# Receipt Parser

Веб-приложение для сканирования QR-кодов с чеков и разделения покупок между людьми.

## Особенности

- 📷 Сканирование QR-кодов через камеру устройства
- 🔍 Парсинг чеков из сербской системы фискализации (suf.purs.gov.rs)
- 💾 Сохранение чеков в localStorage
- 👥 Разделение чека между несколькими покупателями
- 📱 Адаптивный дизайн для мобильных устройств

## Технологический стек

### Backend
- Node.js + Express
- CORS proxy для обхода ограничений suf.purs.gov.rs

### Frontend
- React + Vite
- JavaScript (ES6+)
- Tailwind CSS
- html5-qrcode для сканирования QR
- Zustand для state management
- React Router для навигации

## Архитектура

```
receipt-parser/
├── backend/                    # Express.js CORS proxy
│   └── src/
│       ├── proxy/
│       │   └── receiptProxy.js    # Proxy для suf.purs.gov.rs
│       └── server.js
│
├── frontend/                   # React + Vite
    └── src/
        ├── core/                    # Бизнес-логика
        │   ├── domain/             # Доменные сущности
        │   ├── services/           # Сервисы (парсинг, сканирование)
        │   └── repositories/       # Хранилище данных
        │
        ├── presentation/           # UI компоненты
        │   └── components/
        │       ├── QRScanner/
        │       ├── ReceiptList/
        │       ├── ReceiptDetail/
        │       └── SplitReceipt/
        │
        └── store/                  # Zustand store
```

## Установка и запуск

### 1. Установка зависимостей

```bash
# Backend зависимости
cd backend
npm install

# Frontend зависимости
cd ../frontend
npm install
```

### 2. Запуск Backend

```bash
cd backend
npm start
# Сервер запустится на http://localhost:3001
```

Или в режиме разработки с автоперезагрузкой:

```bash
npm run dev
```

### 3. Запуск Frontend

```bash
cd frontend
npm run dev
# Приложение запустится на http://localhost:5173
```

### 4. Сборка для продакшена

```bash
cd frontend
npm run build
```

## Использование

### Сканирование чека

1. Откройте приложение и перейдите на страницу "Scan"
2. Нажмите "Start Camera" для сканирования QR-кода
3. Или введите URL чека вручную
4. Чек автоматически распарсится и сохранится

### Просмотр чеков

На главной странице отображается список всех сохранённых чеков с:
- Названием магазина
- Датой покупки
- Общей суммой

### Разделение чека

1. Откройте чек и нажмите "Split Receipt"
2. Добавьте покупателей
3. Распределите продукты между покупателями
4. Сумма автоматически пересчитывается для каждого покупателя

## API

### POST /api/receipts/parse

Парсит чек по URL из сербской системы.

**Request:**
```json
{
  "url": "https://suf.purs.gov.rs/v/?vl=..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "invoiceNumber": "W36AXTQX-W36AXTQX-57520",
    "storeName": "Receipt from SUF system",
    "date": "2026-03-01T18:00:00.000Z",
    "products": [
      {
        "name": "Banane, rinfuz/KG/0080000",
        "quantity": 0.548,
        "unit": "KG",
        "unitPrice": 179.99,
        "total": 98.63,
        "taxRate": 10
      }
    ],
    "totalAmount": 5000.00,
    "taxAmount": 500.00
  }
}
```

## Примечания

- **HTTPS для камеры**: В продакшене требуется HTTPS для доступа к камере. Локально http://localhost работает.
- **CORS Proxy**: Backend proxy необходим для suf.purs.gov.rs, который не поддерживает CORS.
- **LocalStorage**: Чеки сохраняются в localStorage браузера. Для продакшена рекомендуется реализовать backend хранилище.
- **Мобильная поддержка**: html5-qrcode хорошо работает на мобильных устройствах.

---

## 🚀 Развертывание на GitHub Pages + Render.com

### Архитектура продакшена

```
GitHub Pages (Frontend) → Render.com (Backend Proxy) → suf.purs.gov.rs
     https://username.github.io     https://your-backend.onrender.com
```

### Шаг 1: Деплой Backend на Render.com

1. **Создайте аккаунт на [Render.com](https://render.com)**

2. **Создайте новый Web Service**
   - Нажмите "New +" → "Web Service"
   - Подключите ваш GitHub репозиторий
   - Render автоматически найдёт `backend/render.yaml`

3. **Настройте переменные окружения** (в Render Dashboard):
   ```
   FRONTEND_URL=https://[ваш-username].github.io/recieptParser/
   ```
   - Замените `ваш-username` на ваш GitHub username
   - Если репозиторий называется иначе, замените `recieptParser`

4. **Дождитесь деплоя**
   - Render предоставит URL вида: `https://receipt-parser-backend.onrender.com`
   - Сохраните этот URL для следующего шага

5. **Проверьте работу backend**
   ```bash
   curl https://your-backend.onrender.com/api/receipts/parse \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"url":"https://suf.purs.gov.rs/v/?vl=test"}'
   ```

### Шаг 2: Деплой Frontend на GitHub Pages

1. **Настройте переменную окружения для production backend**

   В файле `frontend/.env.production`:
   ```env
   VITE_BACKEND_URL=https://your-backend.onrender.com
   ```
   Замените на ваш URL из Render.com

2. **Настройте base path в Vite**

   Отредактируйте `frontend/vite.config.js`, заменив `recieptParser` на имя вашего репозитория:
   ```js
   export default defineConfig({
     plugins: [react()],
     base: '/ваш-репозиторий/', // Имя репозитория на GitHub
     // ...
   })
   ```

3. **Соберите фронтенд**
   ```bash
   cd frontend
   npm run build:gh-pages
   ```

4. **Задеплойте на GitHub Pages**

   **Вариант A: Автоматический деплой (рекомендуется)**
   ```bash
   npm run deploy
   ```

   **Вариант B: Вручную через GitHub UI**
   - Откройте ваш репозиторий на GitHub
   - Settings → Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages` → `/ (root)`
   - Нажмите Save

5. **Доступ к приложению**
   ```
   https://[ваш-username].github.io/[ваш-репозиторий]/
   ```

### Шаг 3: Настройка CORS на Render.com

1. Откройте ваш Render Dashboard
2. В настройках Web Service добавьте переменную окружения:
   ```
   FRONTEND_URL=https://[ваш-username].github.io/[ваш-репозиторий]/
   ```
3. Render автоматически перезапустит сервер

### Тестирование продакшена

1. Откройте ваше приложение на GitHub Pages
2. Попробуйте отсканировать QR код или ввести URL
3. Проверьте консоль браузера на наличие ошибок
4. Проверьте Network Tab чтобы убедиться, что запросы идут к Render.com backend

### Обновление приложения

**Для обновления frontend:**
```bash
cd frontend
npm run deploy
```

**Для обновления backend:**
- Просто запушьте изменения в GitHub
- Render автоматически задеплоит новую версию

### Альтернативные варианты Backend

Если Render.com не подходит, можно использовать:

#### Вариант 1: Railway
```yaml
# backend/railway.json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node src/server.js",
    "healthcheckPath": "/api/receipts/parse"
  }
}
```

#### Вариант 2: Vercel (serverless functions)
```javascript
// api/receipts/parse.js
export default async function handler(req, res) {
  // Код из receiptProxy.js
}
```

#### Вариант 3: Fly.io
```bash
fly launch
fly deploy
```

## Лицензия

ISC
