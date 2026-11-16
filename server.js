import express from 'express';
import db from './database.js';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

// 1. Получение всех рецептов (с фильтрацией и ингредиентами)
app.get('/api/recipes', (req, res) => {
    const difficulty = req.query.difficulty;
    const maxTime = req.query.maxTime;

    let sql = `SELECT * FROM recipes WHERE 1=1`;
    const params = [];

    if (difficulty) {
        sql += ` AND difficulty = ?`;
        params.push(difficulty);
    }
    if (maxTime) {
        sql += ` AND cooking_time <= ?`;
        params.push(Number(maxTime));
    }

    db.all(sql, params, (err, recipes) => {
        if (err) return res.status(500).json({ error: err.message });

        db.all(`SELECT * FROM ingredients`, [], (err, ingredients) => {
            if (err) return res.status(500).json({ error: err.message });

            const result = recipes.map(recipe => ({
                ...recipe,
                ingredients: ingredients.filter(i => i.recipe_id === recipe.id)
            }));
            res.json(result);
        });
    });
});

// 2. Агрегация: Получение суммарного времени всех отфильтрованных рецептов
app.get('/api/recipes/stats', (req, res) => {
    const difficulty = req.query.difficulty;
    const maxTime = req.query.maxTime;

    let sql = `SELECT SUM(cooking_time) as totalTime, COUNT(*) as count FROM recipes WHERE 1=1`;
    const params = [];

    if (difficulty) { sql += ` AND difficulty = ?`; params.push(difficulty); }
    if (maxTime) { sql += ` AND cooking_time <= ?`; params.push(Number(maxTime)); }

    db.get(sql, params, (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ totalTime: row.totalTime || 0, count: row.count || 0 });
    });
});

// 3. Создание рецепта (C)
app.post('/api/recipes', (req, res) => {
    const { name, difficulty, cooking_time } = req.body;
    db.run(`INSERT INTO recipes (name, difficulty, cooking_time) VALUES (?, ?, ?)`,
        [name, difficulty, cooking_time],
        function(err) {
            if (err) return res.status(400).json({ error: err.message });
            res.status(201).json({ id: this.lastID, name, difficulty, cooking_time, ingredients: [] });
        }
    );
});

// 4. Обновление рецепта (U)
app.put('/api/recipes/:id', (req, res) => {
    const { name, difficulty, cooking_time } = req.body;
    db.run(`UPDATE recipes SET name = ?, difficulty = ?, cooking_time = ? WHERE id = ?`,
        [name, difficulty, cooking_time, req.params.id],
        function(err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ updated: this.changes });
        }
    );
});

// 5. Удаление рецепта (D)
app.delete('/api/recipes/:id', (req, res) => {
    db.run(`DELETE FROM recipes WHERE id = ?`, req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

// 6. Добавление ингредиента к рецепту
app.post('/api/recipes/:id/ingredients', (req, res) => {
    const { name, quantity, unit } = req.body;
    db.run(`INSERT INTO ingredients (recipe_id, name, quantity, unit) VALUES (?, ?, ?, ?)`,
        [req.params.id, name, quantity, unit],
        function(err) {
            if (err) return res.status(400).json({ error: err.message });
            res.status(201).json({ id: this.lastID, recipe_id: Number(req.params.id), name, quantity, unit });
        }
    );
});

app.listen(PORT, () => console.log(`Сервер запущен на http://localhost:${PORT}`));
