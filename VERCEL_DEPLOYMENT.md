# 🚀 Деплой на Vercel

## Почему Vercel?

- ✅ **Frontend + Backend в одном месте** - не нужно отдельные сервисы
- ✅ **Автоматический HTTPS** - работает сразу после деплоя
- ✅ **Serverless функции** - платите только за запросы (бесплатно для небольших проектов)
- ✅ **GitHub интеграция** - автоматический деплой после пуша
- ✅ **Простые URL** - ваш-project.vercel.app

---

## 📋 Предварительные требования

1. Аккаунт на [Vercel.com](https://vercel.com) (можно войти через GitHub)
2. Git репозиторий с кодом проекта

---

## 🚀 Метод 1: Деплой через Vercel CLI (Рекомендуется)

### Шаг 1: Установка Vercel CLI

```bash
npm install -g vercel
```

### Шаг 2: Логин в Vercel

```bash
vercel login
```

Следуйте инструкциям в браузере для авторизации через GitHub.

### Шаг 3: Деплой проекта

```bash
cd /Users/olyabaranova/Desktop/recieptParser
vercel
```

Vercel задаст несколько вопросов:
- **Set up and deploy?** `Y`
- **Which scope?** Выберите ваш аккаунт
- **Link to existing project?** `N`
- **Project name:** `receipt-parser` (или любое другое имя)
- **In which directory is your code located?** `.` (текущая директория)
- **Override settings?** `N`

### Шаг 4: Дождитесь завершения деплоя

Vercel автоматически:
1. Соберёт фронтенд (`npm run build` в папке `frontend`)
2. Разместит serverless функции из папки `api/`
3. Предоставит URL вида: `https://receipt-parser.vercel.app`

### Шаг 5: Проверьте работу

Откройте предоставленный URL и попробуйте:
1. Отсканировать QR код
2. Ввести URL чека вручную
3. Проверить Network Tab в DevTools - запросы должны идти к `/api/receipts/parse`

---

## 🌐 Метод 2: Деплой через Vercel Dashboard

### Шаг 1: Создайте репозиторий на GitHub

```bash
cd /Users/olyabaranova/Desktop/recieptParser
git init
git add .
git commit -m "Initial commit: Receipt Parser for Vercel"

# Создайте репозиторий на GitHub и добавьте его
git remote add origin https://github.com/username/receipt-parser.git
git branch -M main
git push -u origin main
```

### Шаг 2: Импортируйте проект на Vercel

1. Откройте [vercel.com/dashboard](https://vercel.com/dashboard)
2. Нажмите **"Add New..."** → **"Project"**
3. Нажмите **"Import Git Repository"**
4. Выберите ваш репозиторий
5. Нажмите **"Import"**

### Шаг 3: Настройте проект

Vercel автоматически определит настройки, но проверьте:

| Настройка | Значение |
|-----------|----------|
| Framework Preset | Vite |
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

### Шаг 4: Деплой

Нажмите **"Deploy"** и дождитесь завершения (~2-3 минуты).

---

## ✅ Проверка деплоя

### 1. Проверьте Frontend

Откройте ваш URL: `https://ваш-проект.vercel.app`

### 2. Проверьте API

Протестируйте API функцию:

```bash
curl https://ваш-проект.vercel.app/api/receipts/parse \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"url":"https://suf.purs.gov.rs/v/?vl=test"}'
```

Должен вернуться JSON с данными чека или ошибкой (это нормально для тестового URL).

### 3. Проверьте консоль браузера

Откройте DevTools (F12) → Console:
- Не должно быть ошибок CORS
- Не должно быть ошибок `Failed to fetch`

---

## 🔄 Обновление приложения

### Через Vercel CLI

```bash
# Внесите изменения в код
git add .
git commit -m "Update feature"
git push

# Деплой изменений
vercel --prod
```

### Автоматический деплой (через GitHub)

Просто запушьте изменения в основную ветку:
```bash
git add .
git commit -m "Update feature"
git push
```

Vercel автоматически задеплоит изменения!

---

## 🐛 Troubleshooting

### Проблема: "404 Not Found" на `/api/*`

**Причина:** Vercel не нашёл serverless функции

**Решение:**
1. Проверьте, что файл `api/receipts/parse.js` существует
2. Проверьте, что `.vercelignore` не исключает папку `api/`
3. Пересоздайте проект на Vercel

### Проблема: "CORS error"

**Причина:** API функция не возвращает правильные заголовки CORS

**Решение:** Добавьте CORS заголовки в `api/receipts/parse.js`:

```javascript
// В начале функции handler:
res.setHeader('Access-Control-Allow-Credentials', true);
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
```

### Проблема: "Build failed"

**Причина:** Ошибка при сборке фронтенда

**Решение:**
1. Проверьте локально: `cd frontend && npm run build`
2. Если работает, проблема в Vercel окружении
3. Проверьте логи в Vercel Dashboard

### Проблема: "API работает локально, но не на Vercel"

**Причина:** Разница между `http://localhost:3001` и `/api`

**Решение:**
1. Проверьте `frontend/.env.production` - `VITE_BACKEND_URL` должен быть пустым
2. Проверьте `frontend/src/core/services/apiClient.js` - должен правильно обрабатывать пустой `VITE_BACKEND_URL`

---

## 💰 Стоимость

Vercel имеет щедрый бесплатный тариф:

- ✅ **100 GB bandwidth** в месяц
- ✅ **Unlimited deployments**
- ✅ **100 GB hours** serverless execution
- ✅ **Автоматический HTTPS**
- ✅ **Preview deployments** для каждой ветки

Для небольшого личного проекта этого более чем достаточно!

[Подробнее о тарифах](https://vercel.com/pricing)

---

## 📊 Мониторинг

### Vercel Dashboard

Откройте [vercel.com/dashboard](https://vercel.com/dashboard):

1. Выберите ваш проект
2. **Deployments** - история всех деплоев
3. **Logs** - логи serverless функций
4. **Analytics** - метрики посещаемости

### Логи API функций

В Dashboard:
1. Ваш проект → **Functions**
2. Выберите `/api/receipts/parse`
3. Смотрите логи в реальном времени

---

## 🎉 Готово!

Ваше приложение теперь доступно по адресу:
```
https://ваш-проект.vercel.app
```

Поздравляю с успешным деплоем! 🚀

---

## Сравнение с Render.com

| Характеристика | Vercel | Render.com |
|---------------|--------|------------|
| Frontend + Backend вместе | ✅ Да | ❌ Отдельно |
| Serverless функции | ✅ Встроено | ❌ Нет |
| Автоматический HTTPS | ✅ Да | ✅ Да |
| GitHub интеграция | ✅ Да | ✅ Да |
| Бесплатный тариф | ✅ Щедрый | ✅ Ограничен |
| Холодный старт | ~50-100ms | ~50s (free tier) |
| Простота настройки | ✅ Очень просто | ⚠️ Сложнее |

**Vercel проще и лучше для этого проекта!** 🎯
