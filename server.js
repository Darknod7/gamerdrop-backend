const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// Инициализация Supabase (использует переменные из настроек Render)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
app.use(express.static(path.join(__dirname, 'public')));

// API для получения товаров
app.get('/products', async (req, res) => {
    try {
        const { data, error } = await supabase.from('products').select('*');
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ... твой код выше ...

// Render требует, чтобы ты использовал process.env.PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});