import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./recipes.db', (err) => {
    if (err) console.error('Ошибка подключения к БД:', err.message);
    else console.log('Подключено к базе данных SQLite.');
});

db.serialize(() => {
    // Таблица рецептов
    db.run(`CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        difficulty TEXT CHECK(difficulty IN ('Легко', 'Средно', 'Сложно')) NOT NULL,
        cooking_time INTEGER NOT NULL
    )`);

    // Таблица ингредиентов
    db.run(`CREATE TABLE IF NOT EXISTS ingredients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    )`);

    // Вставка тестовых данных, если база пуста
    db.get("SELECT COUNT(*) as count FROM recipes", [], (err, row) => {
        if (row.count === 0) {
            db.run("INSERT INTO recipes (name, difficulty, cooking_time) VALUES ('Блины', 'Легко', 20)");
            db.run("INSERT INTO recipes (name, difficulty, cooking_time) VALUES ('Борщ', 'Сложно', 90)");

            db.run("INSERT INTO ingredients (recipe_id, name, quantity, unit) VALUES (1, 'Мука', 200, 'г')");
            db.run("INSERT INTO ingredients (recipe_id, name, quantity, unit) VALUES (1, 'Молоко', 0.5, 'л')");
            db.run("INSERT INTO ingredients (recipe_id, name, quantity, unit) VALUES (2, 'Свекла', 2, 'шт')");
            db.run("INSERT INTO ingredients (recipe_id, name, quantity, unit) VALUES (2, 'Мясо', 500, 'г')");
        }
    });
});

export default db;
