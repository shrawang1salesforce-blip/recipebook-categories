const storageKey = 'recipe-book-recipes';
const categories = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snacks'];

const sampleRecipes = [
  {
    id: 'sample-pancakes',
    name: 'Buttermilk pancakes',
    category: 'Breakfast',
    ingredients: '1 cup flour\n1 cup buttermilk\n1 egg\n1 tbsp melted butter\n1 tsp baking powder',
    method: 'Whisk everything together until just combined. Cook small ladles of batter in a buttered pan over medium heat, flipping when bubbles appear.',
    addedAt: 3
  },
  {
    id: 'sample-tomato-pasta',
    name: 'Weeknight tomato pasta',
    category: 'Dinner',
    ingredients: 'Pasta\n2 tbsp olive oil\n3 garlic cloves\n1 can chopped tomatoes\nParmesan and basil',
    method: 'Warm the garlic in olive oil, add the tomatoes and simmer while the pasta cooks. Toss together with a splash of pasta water, then finish with parmesan and basil.',
    addedAt: 2
  },
  {
    id: 'sample-apple-crumble',
    name: 'Apple crumble',
    category: 'Dessert',
    ingredients: '4 apples\n1 tbsp sugar\n100g flour\n75g cold butter\n50g oats',
    method: 'Slice the apples into a baking dish and sprinkle with sugar. Rub the flour and butter together, stir in oats, and scatter over the fruit. Bake at 190°C until golden.',
    addedAt: 1
  }
];

const categoryList = document.querySelector('#category-list');
const recipeGrid = document.querySelector('#recipe-grid');
const recipeCount = document.querySelector('#recipe-count');
const searchInput = document.querySelector('#search');
const sortSelect = document.querySelector('#sort-recipes');
const recipeDialog = document.querySelector('#recipe-dialog');
const detailDialog = document.querySelector('#detail-dialog');
const recipeForm = document.querySelector('#recipe-form');
const categorySelect = document.querySelector('#recipe-category');
const recipeDetail = document.querySelector('#recipe-detail');

let recipes = loadRecipes();
let selectedCategory = 'All recipes';

function loadRecipes() {
  try {
    const savedRecipes = localStorage.getItem(storageKey);
    return savedRecipes === null ? [...sampleRecipes] : JSON.parse(savedRecipes);
  } catch {
    return [...sampleRecipes];
  }
}

function saveRecipes() {
  localStorage.setItem(storageKey, JSON.stringify(recipes));
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function visibleRecipes() {
  const query = searchInput.value.trim().toLowerCase();
  const matching = recipes.filter(recipe => {
    const matchesCategory = selectedCategory === 'All recipes' || recipe.category === selectedCategory;
    const matchesSearch = `${recipe.name} ${recipe.ingredients} ${recipe.method}`.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  if (sortSelect.value === 'az') {
    matching.sort((first, second) => first.name.localeCompare(second.name));
  } else {
    matching.sort((first, second) => second.addedAt - first.addedAt);
  }
  return matching;
}

function renderCategories() {
  const choices = ['All recipes', ...categories];
  categoryList.innerHTML = choices.map(category => {
    const count = category === 'All recipes'
      ? recipes.length
      : recipes.filter(recipe => recipe.category === category).length;
    const active = selectedCategory === category;
    return `<button class="category-button${active ? ' active' : ''}" type="button" data-category="${escapeHtml(category)}" aria-pressed="${active}">
      <span>${escapeHtml(category)}</span><span class="category-number">${count}</span>
    </button>`;
  }).join('');
}

function renderRecipes() {
  const matching = visibleRecipes();
  const noun = matching.length === 1 ? 'recipe' : 'recipes';
  recipeCount.textContent = `${matching.length} ${noun}`;
  document.querySelector('#recipe-list-title').textContent = selectedCategory;
  document.querySelector('#reset-filter').hidden = selectedCategory === 'All recipes';
  renderCategories();

  if (!matching.length) {
    const hasRecipes = recipes.length > 0;
    recipeGrid.innerHTML = `<div class="empty-state">
      <span class="empty-state-mark" aria-hidden="true">${hasRecipes ? '...' : '+'}</span>
      <h3>${hasRecipes ? 'Nothing turned up' : 'Start your recipe book'}</h3>
      <p>${hasRecipes ? 'Try another search or category.' : 'Add a recipe you want to remember.'}</p>
      ${hasRecipes ? '' : '<button class="button button-primary" type="button" data-action="add">Add a recipe</button>'}
    </div>`;
    return;
  }

  recipeGrid.innerHTML = matching.map(recipe => {
    const notes = recipe.method || recipe.ingredients || 'No notes yet.';
    return `<article class="recipe-card">
      <div class="card-topline">
        <span class="category-tag">${escapeHtml(recipe.category)}</span>
        <div class="card-menu">
          <button class="small-action" type="button" data-action="edit" data-id="${escapeHtml(recipe.id)}" aria-label="Edit ${escapeHtml(recipe.name)}">Edit</button>
          <button class="small-action" type="button" data-action="delete" data-id="${escapeHtml(recipe.id)}" aria-label="Delete ${escapeHtml(recipe.name)}">Delete</button>
        </div>
      </div>
      <button class="recipe-title" type="button" data-action="detail" data-id="${escapeHtml(recipe.id)}">${escapeHtml(recipe.name)}</button>
      <p class="recipe-preview">${escapeHtml(notes)}</p>
      <div class="card-footer"><span aria-hidden="true">•</span> In your collection</div>
    </article>`;
  }).join('');
}

function fillCategorySelect() {
  categorySelect.innerHTML = categories.map(category => `<option value="${category}">${category}</option>`).join('');
}

function openForm(recipe) {
  recipeForm.reset();
  document.querySelector('#recipe-id').value = recipe?.id || '';
  document.querySelector('#dialog-title').textContent = recipe ? 'Edit recipe' : 'Add a recipe';
  document.querySelector('#recipe-name').value = recipe?.name || '';
  categorySelect.value = recipe?.category || (categories.includes(selectedCategory) ? selectedCategory : categories[0]);
  document.querySelector('#recipe-ingredients').value = recipe?.ingredients || '';
  document.querySelector('#recipe-method').value = recipe?.method || '';
  recipeDialog.showModal();
  document.querySelector('#recipe-name').focus();
}

function showDetails(recipe) {
  const ingredients = recipe.ingredients.trim()
    ? recipe.ingredients.split('\n').filter(line => line.trim()).map(line => `<li>${escapeHtml(line)}</li>`).join('')
    : '<li>No ingredients listed yet.</li>';
  const method = recipe.method.trim() ? escapeHtml(recipe.method) : 'No method or notes yet.';
  recipeDetail.innerHTML = `<div class="detail-content">
    <span class="category-tag">${escapeHtml(recipe.category)}</span>
    <h2>${escapeHtml(recipe.name)}</h2>
    <p class="detail-date">One of your saved recipes</p>
    <div class="detail-columns">
      <section><h3>Ingredients</h3><ul>${ingredients}</ul></section>
      <section><h3>Method & notes</h3><p>${method}</p></section>
    </div>
    <div class="detail-actions">
      <button class="button button-quiet" type="button" data-action="close-detail">Done</button>
      <button class="button button-primary" type="button" data-action="edit" data-id="${escapeHtml(recipe.id)}">Edit recipe</button>
    </div>
  </div>`;
  detailDialog.showModal();
}

function findRecipe(id) {
  return recipes.find(recipe => recipe.id === id);
}

categoryList.addEventListener('click', event => {
  const button = event.target.closest('[data-category]');
  if (!button) return;
  selectedCategory = button.dataset.category;
  renderRecipes();
});

recipeGrid.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const recipe = findRecipe(button.dataset.id);

  if (button.dataset.action === 'add') openForm();
  if (button.dataset.action === 'edit' && recipe) openForm(recipe);
  if (button.dataset.action === 'detail' && recipe) showDetails(recipe);
  if (button.dataset.action === 'delete' && recipe && window.confirm(`Delete "${recipe.name}"?`)) {
    recipes = recipes.filter(item => item.id !== recipe.id);
    saveRecipes();
    renderRecipes();
  }
});

recipeDetail.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  if (button.dataset.action === 'close-detail') detailDialog.close();
  if (button.dataset.action === 'edit') {
    const recipe = findRecipe(button.dataset.id);
    detailDialog.close();
    if (recipe) openForm(recipe);
  }
});

recipeForm.addEventListener('submit', event => {
  event.preventDefault();
  const id = document.querySelector('#recipe-id').value;
  const existing = findRecipe(id);
  const recipe = {
    id: existing ? existing.id : `recipe-${crypto.randomUUID()}`,
    name: document.querySelector('#recipe-name').value.trim(),
    category: categorySelect.value,
    ingredients: document.querySelector('#recipe-ingredients').value.trim(),
    method: document.querySelector('#recipe-method').value.trim(),
    addedAt: existing ? existing.addedAt : Date.now()
  };

  if (existing) {
    recipes = recipes.map(item => item.id === existing.id ? recipe : item);
  } else {
    recipes.push(recipe);
  }
  saveRecipes();
  recipeDialog.close();
  renderRecipes();
});

document.querySelector('#new-recipe').addEventListener('click', () => openForm());
document.querySelector('#close-dialog').addEventListener('click', () => recipeDialog.close());
document.querySelector('#cancel-dialog').addEventListener('click', () => recipeDialog.close());
document.querySelector('#reset-filter').addEventListener('click', () => {
  selectedCategory = 'All recipes';
  renderRecipes();
});
document.querySelector('#clear-samples').addEventListener('click', () => {
  if (!recipes.some(recipe => recipe.id.startsWith('sample-'))) return;
  if (window.confirm('Remove the sample recipes? Your own recipes will stay.')) {
    recipes = recipes.filter(recipe => !recipe.id.startsWith('sample-'));
    saveRecipes();
    renderRecipes();
  }
});
searchInput.addEventListener('input', renderRecipes);
sortSelect.addEventListener('change', renderRecipes);

fillCategorySelect();
renderRecipes();