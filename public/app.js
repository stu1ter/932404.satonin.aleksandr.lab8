// Элементы страницы
const recipesList = document.getElementById('recipes-list');
const recipeForm = document.getElementById('recipe-form');
const statsPanel = document.getElementById('stats-panel');

// Фильтры
const filterDifficulty = document.getElementById('filter-difficulty');
const filterTime = document.getElementById('filter-time');
const timeVal = document.getElementById('time-val');

// Элементы формы рецепта
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');

// Модальное окно ингредиентов
const ingredientModal = document.getElementById('ingredient-modal');
const ingredientForm = document.getElementById('ingredient-form');
const closeModalBtn = document.getElementById('close-modal-btn');

// Функция загрузки всех данных
async function loadData() {
    const diff = filterDifficulty.value;
    const time = filterTime.value;

    // 1. Получаем рецепты
    const recipesResponse = await fetch(`/api/recipes?difficulty=${diff}&maxTime=${time}`);
    const recipes = await recipesResponse.json();

    // 2. Получаем статистику (агрегацию)
    const statsResponse = await fetch(`/api/recipes/stats?difficulty=${diff}&maxTime=${time}`);
    const stats = await statsResponse.json();

    // Выводим статистику
    statsPanel.innerHTML = `Рецептов: ${stats.count} | Общее время: ${stats.totalTime} мин.`;

    // Очищаем список и выводим карточки
    recipesList.innerHTML = '';

    if (recipes.length === 0) {
        recipesList.innerHTML = '<p>Рецепты не найдены</p>';
        return;
    }

    recipes.forEach(recipe => {
        const card = document.createElement('div');
        card.className = 'recipe-card';

        // Формируем список ингредиентов текста
        let ingredientsHTML = '';
        recipe.ingredients.forEach(ing => {
            ingredientsHTML += `<li>${ing.name} — ${ing.quantity} ${ing.unit}</li>`;
        });

        card.innerHTML = `
            <h3>${recipe.name}</h3>
            <p><strong>Сложность:</strong> ${recipe.difficulty}</p>
            <p><strong>Время:</strong> ${recipe.cooking_time} мин.</p>
            <ul class="ingredients-list">${ingredientsHTML}</ul>

            <button class="btn-success btn-add-ing">+ Ингредиент</button>
            <button class="btn-secondary btn-edit">Редактировать</button>
            <button class="btn-danger btn-delete">Удалить</button>
        `;

        // Назначаем события кнопкам напрямую
        card.querySelector('.btn-add-ing').onclick = () => openIngredientModal(recipe.id);
        card.querySelector('.btn-edit').onclick = () => startEdit(recipe);
        card.querySelector('.btn-delete').onclick = () => deleteRecipe(recipe.id);

        recipesList.appendChild(card);
    });
}

// Удаление рецепта
async function deleteRecipe(id) {
    if (confirm('Удалить этот рецепт?')) {
        await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
        loadData();
    }
}

// Переход в режим редактирования
function startEdit(recipe) {
    document.getElementById('recipe-id').value = recipe.id;
    document.getElementById('recipe-name').value = recipe.name;
    document.getElementById('recipe-difficulty').value = recipe.difficulty;
    document.getElementById('recipe-cooking-time').value = recipe.cooking_time;

    formTitle.textContent = 'Редактировать рецепт';
    submitBtn.textContent = 'Сохранить';
    cancelBtn.classList.remove('hidden');
}

// Сброс формы рецепта
function resetForm() {
    recipeForm.reset();
    document.getElementById('recipe-id').value = '';
    formTitle.textContent = 'Добавить рецепт';
    submitBtn.textContent = 'Создать рецепт';
    cancelBtn.classList.add('hidden');
}

// Открытие модалки для ингредиента
function openIngredientModal(recipeId) {
    document.getElementById('modal-recipe-id').value = recipeId;
    ingredientModal.classList.remove('hidden');
}

// Обработка отправки формы рецепта (Добавление / Изменение)
recipeForm.onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('recipe-id').value;
    const payload = {
        name: document.getElementById('recipe-name').value,
        difficulty: document.getElementById('recipe-difficulty').value,
        cooking_time: Number(document.getElementById('recipe-cooking-time').value)
    };

    if (id) {
        // Если ID есть — обновляем
        await fetch(`/api/recipes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } else {
        // Если ID нет — создаем новый
        await fetch('/api/recipes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    }

    resetForm();
    loadData();
};

// Обработка добавления ингредиента
ingredientForm.onsubmit = async (e) => {
    e.preventDefault();
    const recipeId = document.getElementById('modal-recipe-id').value;
    const payload = {
        name: document.getElementById('ing-name').value,
        quantity: Number(document.getElementById('ing-qty').value),
        unit: document.getElementById('ing-unit').value
    };

    await fetch(`/api/recipes/${recipeId}/ingredients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    ingredientModal.classList.add('hidden');
    ingredientForm.reset();
    loadData();
};

// События фильтров
filterDifficulty.onchange = () => loadData();
filterTime.oninput = (e) => {
    timeVal.textContent = e.target.value;
    loadData();
};

// Кнопки закрытия / отмены
closeModalBtn.onclick = () => ingredientModal.classList.add('hidden');
cancelBtn.onclick = () => resetForm();

// Первая загрузка при старте страницы
loadData();
