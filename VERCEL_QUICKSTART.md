# ⚡ Быстрый старт с Vercel

## Установка и деплой за 5 минут

### 1. Установите Vercel CLI

```bash
npm install -g vercel
```

### 2. Войдите в Vercel

```bash
vercel login
```

### 3. Задеплойте проект

```bash
cd /Users/olyabaranova/Desktop/recieptParser
vercel
```

Ответьте на вопросы:
- **Set up and deploy?** → `Y`
- **Which scope?** → ваш аккаунт
- **Link to existing project?** → `N`
- **Project name:** → `receipt-parser` (или любое имя)
- **In which directory?** → `.`

### 4. Готово! 🎉

Через 2-3 минуты получите URL вида:
```
https://receipt-parser.vercel.app
```

---

## Для продакшена (постоянный URL)

```bash
vercel --prod
```

---

## Обновление приложения

```bash
# Внесите изменения
git add .
git commit -m "Update"
git push

# Задеплойте
vercel --prod
```

---

## Структура проекта

```
recieptParser/
├── api/
│   └── receipts/
│       └── parse.js          # ← Serverless API функция
├── frontend/
│   ├── src/
│   │   ├── core/             # Бизнес-логика
│   │   ├── presentation/     # UI компоненты
│   │   └── store/            # Zustand store
│   ├── dist/                 # ← Собранный фронтенд
│   └── package.json
├── vercel.json               # ← Конфигурация Vercel
└── .vercelignore             # ← Исключения из деплоя
```

---

## Что происходит?

Vercel автоматически:
1. ✅ Собирает фронтенд из `frontend/`
2. ✅ Размещает serverless API из `api/`
3. ✅ Выдаёт HTTPS сертификат
4. ✅ Настраивает маршрутизацию

**Frontend и API на одном домене!**

---

## Проверка работы

1. Откройте ваш URL на Vercel
2. Попробуйте отсканировать QR код
3. Введите URL чека вручную
4. Проверьте DevTools → Network - запросы идут к `/api/receipts/parse`

---

## Проблемы?

**404 на `/api/*`:**
- Проверьте, что файл `api/receipts/parse.js` существует
- Проверьте, что `.vercelignore` не исключает папку `api/`

**CORS ошибки:**
- В `api/receipts/parse.js` уже добавлены CORS заголовки
- Очистите кэш браузера (Cmd+Shift+R)

**Build failed:**
- Проверьте локально: `cd frontend && npm run build`
- Посмотрите логи в Vercel Dashboard

---

## Полная документация

См. [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) для подробной инструкции.
