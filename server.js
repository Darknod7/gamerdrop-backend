const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Раздаем статические файлы (HTML, CSS, JS) из папки public
app.use(express.static(path.join(__dirname, 'public')));

// Роут для отдачи товаров прямо из твоего файла products.json
app.get('/products', (req, res) => {
    try {
        const filePath = path.join(__dirname, 'products.json');
        const data = fs.readFileSync(filePath, 'utf8');
        res.json(JSON.parse(data));
    } catch (err) {
        console.error("Ошибка чтения локального файла товаров:", err);
        res.status(500).json({ error: "Не удалось загрузить товары" });
    }
});

// Главный роут для открытия сайта
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});