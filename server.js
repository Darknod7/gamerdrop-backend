const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// Инициализируем базу данных Supabase с помощью ключей из Render
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Раздаем статические файлы фронтенда из папки public
app.use(express.static(path.join(__dirname, 'public')));

// Роут для получения товаров прямо из Supabase
app.get('/products', async (req, res) => {
    try {
        // Делаем запрос к таблице 'products'
        const { data, error } = await supabase
            .from('products')
            .select('*');

        if (error) {
            throw error;
        }

        // Отправляем массив товаров на фронтенд
        res.json(data);
    } catch (err) {
        console.error("Ошибка получения товаров из Supabase:", err);
        res.status(500).json({ error: "Не удалось загрузить товары из базы данных" });
    }
});

// Перехватчик для корректной работы путей и страниц
app.get('(.*)', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});