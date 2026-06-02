const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));
const path = require('path');
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// === НАСТРОЙКА СВЯЗИ С БАЗОЙ ДАННЫХ ===
// ЗАМЕНИ ТЕКСТ В КАВЫЧКАХ НА СВОИ ДАННЫЕ ИЗ БЛОКНОТА:
const SUPABASE_URL = 'https://jebpqlinnznogoaktsov.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplYnBxbGlubnpub2dvYWt0c292Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MTM5NTYsImV4cCI6MjA5NTk4OTk1Nn0.AXAqko8wZwjYZXhWt50hmaNzQJionZbtdygNZlntRpo';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 1. АВТОРИЗАЦИЯ И РЕГИСТРАЦИЯ ИЗ TELEGRAM
app.post('/api/auth', async (req, res) => {
    const { telegram_id, username } = req.body;
    
    let { data: user, error } = await supabase.from('users').select('*').eq('telegram_id', telegram_id).single();
    
    if (!user) {
        const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert([{ telegram_id, username, balance_rub: 500.00 }])
            .select().single();
        user = newUser;
    }
    res.json(user);
});

// 2. ПОЛУЧЕНИЕ СПИСКА ТОВАРОВ
app.get('/api/products', async (req, res) => {
    const { game_type } = req.query;
    let query = supabase.from('products').select('*').eq('status', 'in_sale');
    
    if (game_type) query = query.eq('game_type', game_type);
    
    const { data: products, error } = await query;
    res.json(products);
});

// 3. ДОБАВЛЕНИЕ НОВОГО ТОВАРА
app.post('/api/products', async (req, res) => {
    const { title, description, price_rub, game_type, category, nft_serial_number, seller_id } = req.body;
    
    const { data, error } = await supabase.from('products').insert([
        { title, description, price_rub, game_type, category, nft_serial_number, seller_id }
    ]);
    res.json({ success: true, message: "Товар успешно выставлен на GamerDrop!" });
});

// 4. ГАРАНТА: ПОКУПКА И ЗАМОРОЗКА СРЕДСТВ
app.post('/api/deals/pay', async (req, res) => {
    const { product_id, buyer_id } = req.body;

    const { data: product } = await supabase.from('products').select('*').eq('id', product_id).single();
    const { data: buyer } = await supabase.from('users').select('*').eq('telegram_id', buyer_id).single();

    if (buyer.balance_rub < product.price_rub) {
        return res.status(400).json({ error: "Недостаточно денег на балансе GamerDrop!" });
    }

    const newBuyerBalance = buyer.balance_rub - product.price_rub;
    await supabase.from('users').update({ balance_rub: newBuyerBalance }).eq('telegram_id', buyer_id);
    await supabase.from('products').update({ status: 'sold' }).eq('id', product_id);

    const { data: deal } = await supabase.from('deals').insert([
        { product_id, buyer_id, seller_id: product.seller_id, status: 'paid', total_price: product.price_rub }
    ]).select().single();

    res.json({ success: true, message: "Деньги заморожены гарантом. Открыт чат сделки!", deal_id: deal.id });
});

// 5. ГАРАНТА: ПОДТВЕРЖДЕНИЕ И ВЫПЛАТА С УЧЕТОМ КОМИССИИ 7%
app.post('/api/deals/confirm', async (req, res) => {
    const { deal_id } = req.body;

    const { data: deal } = await supabase.from('deals').select('*').eq('id', deal_id).single();
    if (deal.status !== 'paid') return res.status(400).json({ error: "Сделка уже завершена или не оплачена" });

    const commissionRate = 0.07;
    const adminProfit = deal.total_price * commissionRate; 
    const sellerProfit = deal.total_price - adminProfit;    

    const { data: seller } = await supabase.from('users').select('*').eq('telegram_id', deal.seller_id).single();
    const newSellerBalance = Number(seller.balance_rub) + Number(sellerProfit);

    await supabase.from('users').update({ balance_rub: newSellerBalance }).eq('telegram_id', deal.seller_id);
    await supabase.from('deals').update({ status: 'completed' }).eq('id', deal_id);

    res.json({ 
        success: true, 
        message: "Сделка закрыта!", 
        seller_received: sellerProfit.toFixed(2), 
        gamerdrop_profit: adminProfit.toFixed(2) 
    });
});

// 6. ЗАЯВКА НА ВЫВОД СРЕДСТВ
app.post('/api/withdraw', async (req, res) => {
    const { telegram_id, amount, payout_method, card_number } = req.body;

    const { data: user } = await supabase.from('users').select('*').eq('telegram_id', telegram_id).single();
    if (user.balance_rub < amount) return res.status(400).json({ error: "Недостаточно средств для вывода" });

    const newBalance = user.balance_rub - amount;
    await supabase.from('users').update({ balance_rub: newBalance }).eq('telegram_id', telegram_id);

    console.log(`ЗАЯВКА НА ВЫВОД: Пользователь ${telegram_id} выводит ${amount} руб. На карту: ${card_number}`);
    res.json({ success: true, message: "Заявка на вывод принята! Деньги поступят на карту в течение 24 часов." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`GamerDrop Бэкенд запущен на порту ${PORT}`));