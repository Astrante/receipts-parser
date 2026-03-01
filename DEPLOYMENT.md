# Руководство по развертыванию на GitHub Pages + Render.com

## 📋 Предварительные требования

1. Аккаунт на GitHub
2. Аккаунт на [Render.com](https://render.com)
3. Установленные Git и Node.js

---

## 🚀 Шаг 1: Подготовка репозитория GitHub

### 1.1 Создайте репозиторий на GitHub

```bash
git init
git add .
git commit -m "Initial commit"

# Добавьте удалённый репозиторий
git remote add origin https://github.com/username/recieptParser.git
git branch -M main
git push -u origin main
```

### 1.2 Замените `recieptParser` на имя вашего репозитория в следующих файлах:

- `frontend/vite.config.js`: `base: '/ваш-репозиторий/'`
- `backend/render.yaml`: `FRONTEND_URL`
- `frontend/.env.production`: (будет настроено позже)

---

## 🎯 Шаг 2: Деплой Backend на Render.com

### 2.1 Создайте Web Service на Render

1. Войдите на [render.com](https://dashboard.render.com)
2. Нажмите **"New +"** → **"Web Service"**
3. Нажмите **"Connect GitHub"** и выберите ваш репозиторий
4. Render автоматически найдёт `backend/render.yaml`

### 2.2 Настройки деплоя

| Настройка | Значение |
|-----------|----------|
| Name | `receipt-parser-backend` |
| Region | `Singapore` (ближе к Сербии) или `Frankfurt` |
| Branch | `main` |
| Root Directory | `backend` |
| Runtime | `Node 18` |

### 2.3 Переменные среды (Environment Variables)

Добавьте в Render Dashboard:

```
FRONTEND_URL=https://[ваш-username].github.io/[ваш-репозиторий]/
```

**Пример:**
```
FRONTEND_URL=https://olyabaranova.github.io/recieptParser/
```

### 2.4 Деплой

Нажмите **"Create Web Service"** и дождитесь завершения деплоя (2-3 минуты).

### 2.5 Получите URL Backend

После деплоя Render предоставит URL:
```
https://receipt-parser-backend.onrender.com
```

**Скопируйте этот URL!** Он понадобится для настройки frontend.

### 2.6 Проверьте работу Backend

```bash
# Тестовый запрос
curl https://receipt-parser-backend.onrender.com/api/receipts/parse \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"url":"https://suf.purs.gov.rs/v/?vl=test"}'
```

---

## 🌐 Шаг 3: Настройка Frontend для GitHub Pages

### 3.1 Обновите `.env.production`

Создайте/отредактируйте `frontend/.env.production`:

```env
VITE_BACKEND_URL=https://receipt-parser-backend.onrender.com
```

Замените на ваш URL из шага 2.5.

**Важно:** Файл `.env.production` должен быть закоммичен в Git для корректной работы!

### 3.2 Проверьте `vite.config.js`

Убедитесь, что `base` соответствует имени вашего репозитория:

```javascript
export default defineConfig({
  plugins: [react()],
  base: '/recieptParser/', // ← замените на имя вашего репозитория
  // ...
})
```

### 3.3 Соберите Frontend

```bash
cd frontend
npm run build:gh-pages
```

Проверьте, что папка `dist/` создана успешно.

---

## 📤 Шаг 4: Деплой на GitHub Pages

### Вариант A: Автоматический деплой с gh-pages

1. **Установите пакет** (уже установлен):
   ```bash
   npm install -D gh-pages
   ```

2. **Задеплойте**:
   ```bash
   npm run deploy
   ```

3. **Проверьте**:
   ```
   https://[ваш-username].github.io/[ваш-репозиторий]/
   ```

### Вариант B: Деплой через GitHub Actions

Создайте файл `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd frontend
          npm ci

      - name: Build
        run: |
          cd frontend
          npm run build:gh-pages

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./frontend/dist
```

### Вариант C: Ручной деплой через GitHub UI

1. Откройте ваш репозиторий на GitHub
2. **Settings** → **Pages**
3. **Source**: Deploy from a branch
4. **Branch**: `gh-pages` → `/ (root)`
5. Нажмите **Save**

---

## ✅ Шаг 5: Финальная проверка

### 5.1 Проверьте Frontend

Откройте ваше приложение:
```
https://[ваш-username].github.io/[ваш-репозиторий]/
```

### 5.2 Проверьте работу приложения

1. Откройте DevTools (F12)
2. Перейдите на вкладку **Network**
3. Попробуйте ввести URL чека
4. Убедитесь, что запросы идут к Render.com backend, а не к localhost

### 5.3 Проверьте Console на ошибки

Не должно быть ошибок типа:
- ❌ `net::ERR_CONNECTION_REFUSED`
- ❌ `CORS policy`
- ❌ `404 Not Found`

---

## 🔄 Обновление приложения

### Обновление Backend

```bash
git add .
git commit -m "Update backend"
git push
```

Render автоматически задеплоит изменения.

### Обновление Frontend

```bash
cd frontend
npm run deploy
```

---

## 🐛 Troubleshooting

### Проблема: "Failed to fetch"

**Причина:** Frontend не может найти backend

**Решение:**
1. Проверьте `VITE_BACKEND_URL` в `.env.production`
2. Убедитесь, что backend запущен на Render.com
3. Проверьте CORS настройки в Render

### Проблема: "404 on GitHub Pages"

**Причина:** Неверный `base` path в vite.config.js

**Решение:**
```js
// Должен совпадать с именем репозитория
base: '/ваш-репозиторий/'
```

### Проблема: "Routing не работает"

**Причина:** GitHub Pages не поддерживает SPA routing

**Решение:** Уже настроено в `vite.config.js`, но если возникли проблемы, добавьте `_redirects`:
```
/* /index.html 200
```

### Проблема: "Backend спит на Render.com"

**Причина:** Бесплатный tier Render засыпает после 15 минут неактивности

**Решение:**
- Первый запрос может занять ~50 секунд (холодный старт)
- Используйте [cron-job.org](https://cron-job.org) для ping каждые 10 минут

---

## 💰 Стоимость

- **GitHub Pages**: Бесплатно 🆓
- **Render.com**: Бесплатно (750 часов/месяц)
  - [Limited free tier](https://render.com/pricing)

---

## 📊 Мониторинг

### Render.com Dashboard

- Откройте [Render Dashboard](https://dashboard.render.com)
- Смотрите логи в реальном времени
- Мониторьте метрики (CPU, Memory, Response time)

### GitHub Pages

- Settings → Pages → Посмотрите историю деплоев

---

## 🎉 Готово!

Ваше приложение теперь доступно по адресу:
```
https://[ваш-username].github.io/[ваш-репозиторий]/
```

Поздравляю с успешным деплоем! 🚀
