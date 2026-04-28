# Receipt Parser

Веб-приложение для сканирования QR-кодов с чеков и разделения покупок между людьми.

## 🌐 Онлайн версия

Сервис доступен по адресу: **https://reciept-parser.vercel.app/**

### Использование онлайн версии
1. Откройте [https://reciept-parser.vercel.app/](https://reciept-parser.vercel.app/)
2. Нажмите "Scan" для сканирования QR-кода с чека
3. Или введите URL чека вручную
4. Чек автоматически распарсится и сохранится в вашем браузере

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

## 🚀 Развертывание на Vercel (рекомендуется)

### Архитектура продакшена

```
Vercel (Frontend + Serverless API) → suf.purs.gov.rs
     https://reciept-parser.vercel.app
```

### Преимущества Vercel

- ✅ **Frontend + Backend вместе** в одном проекте
- ✅ **Автоматический деплой** из Git
- ✅ **Serverless Functions** для API
- ✅ **Быстрая CDN** по всему миру
- ✅ **Бесплатный тариф** с хорошими лимитами

### Шаг 1: Подключение к Vercel

1. **Откройте [vercel.com/new](https://vercel.com/new)**

2. **Импортируйте репозиторий**
   - Выберите `Astrante/receipts-parser` (или ваш репозиторий)
   - Нажмите "Import"

3. **Настройте проект**
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   ```

4. **Нажмите "Deploy"**

### Шаг 2: Готово!

Vercel автоматически:
- Соберёт frontend
- Создаст serverless функцию для `/api/receipts/parse`
- Разместит всё на CDN
- Предоставит URL: `https://reciept-parser.vercel.app`

### Структура Vercel проекта

```
frontend/
├── api/                    # Vercel Serverless Functions
│   └── receipts/
│       └── parse.js       # POST /api/receipts/parse
├── dist/                  # Собранный frontend
└── ...                    # Остальные файлы
```

### Обновление приложения

Просто запушьте изменения в GitHub:
```bash
git add .
git commit -m "Update app"
git push origin main
```

Vercel автоматически задеплоит новую версию! ⚡

---

## 🚀 Альтернативные варианты деплоя

### Вариант 2: GitHub Pages + Render.com

**Frontend**: GitHub Pages
**Backend**: Render.com (Express.js proxy)

Подходит если хотите разделить frontend и backend на разные платформы.

### Вариант 3: Railway + GitHub Pages

**Frontend**: GitHub Pages
**Backend**: Railway (Node.js service)

Альтернатива Render.com с похожими возможностями.

## Лицензия

ISC
