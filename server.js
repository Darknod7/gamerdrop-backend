const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Отдаем статические файлы из папки public
app.use(express.static(path.join(__dirname, 'public')));

// Роут, который возвращает товары из файлика products.json
app.get('/products', (req, res) => {
    try {
        const filePath = path.join(__dirname, 'products.json');
        const data = fs.readFileSync(filePath, 'utf8');
        res.json(JSON.parse(data));
    } catch (err) {
        console.error("Ошибка чтения файла товаров:", err);
        res.status(500).json({ error: "Не удалось загрузить товары" });
    }
});

// Все остальные запросы отправляют index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});