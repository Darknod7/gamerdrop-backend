const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// Инициализируем базу данных Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. Раздаем статические файлы фронтенда из папки public
app.use(express.static(path.join(__dirname, 'public')));

// 2. Роут для получения товаров из Supabase
app.get('/products', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*');

        if (error) {
            throw error;
        }

        res.json(data);
    } catch (err) {
        console.error("Ошибка получения товаров из Supabase:", err);
        res.status(500).json({ error: "Не удалось загрузить товары" });
    }
});

// 3. НЕУБИВАЕМЫЙ перехватчик для Express 5 (без звездочек и скобок)
// Он просто берет любой запрос, который не дошел до /products, и открывает твой сайт
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});