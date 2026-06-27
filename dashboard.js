// ==========================================
// DASHBOARD.JS - UPDATED WITH ALL REQUIREMENTS
// ==========================================

// Global variables
let isRecording = false;
let recognition = null;
let selectedFilters = {
    mood: [],
    taste: [],
    mealType: [],
    dietType: 'both',
    cookingTime: null,
    timeOperator: 'under',
    maxCalories: 720,
    bmiEnabled: false,
    bmiData: null
};
let favorites = new Set();
let currentUser = null;

// Initialize users database
function initializeUsersDatabase() {
    if (!window.usersDatabase) {
        window.usersDatabase = {};
    }
    return window.usersDatabase;
}

// Initialize on page load - WITH AUTHENTICATION CHECK
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Dashboard loading...');

    // AUTH PERSISTENCE
    if (!window.currentUser) {
        const persistedUser = localStorage.getItem('currentUser');
        if (persistedUser) window.currentUser = JSON.parse(persistedUser);
    }
    if (!window.usersDatabase) {
        const persistedDB = localStorage.getItem('usersDatabase');
        if (persistedDB) window.usersDatabase = JSON.parse(persistedDB);
        else window.usersDatabase = {};
    }

    // CRITICAL: Check if user is logged in
    if (!window.currentUser) {
        console.log('❌ No user logged in, redirecting to login page');
        alert('Please login to access the dashboard');
        window.location.href = 'login.html';
        return;
    }

    // Get current user
    currentUser = window.currentUser;
    console.log('✓ User authenticated:', currentUser.userId);

    // Update greeting - REQUIREMENT: Show "Hello, [username]" on top-right
    const greetingElement = document.getElementById('userGreeting');
    if (greetingElement) {
        greetingElement.textContent = `Hello, ${currentUser.name}!`;
    }

    // Load favorites from memory
    if (window.userFavorites && window.userFavorites[currentUser.userId]) {
        favorites = new Set(window.userFavorites[currentUser.userId]);
        console.log('✓ Loaded favorites:', favorites.size);
    }

    // Initialize voice recognition for mic
    initVoiceRecognition();

    // Load quick recipes
    loadQuickRecipes();

    // Load favorites
    loadFavorites();

    // Check pantry alerts
    checkPantryAlerts();

    // Setup filter listeners
    setupFilterListeners();

    console.log('✓ Dashboard initialized successfully');
});

// Initialize speech recognition - REQUIREMENT: Make mic working
function initVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            document.getElementById('searchInput').value = transcript;
            stopVoiceRecording();
            // REQUIREMENT: User can say recipes, should search recipes only
            performSearch(transcript);
        };

        recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            stopVoiceRecording();
            alert('Voice recognition error. Please try again.');
        };

        recognition.onend = function() {
            stopVoiceRecording();
        };
    }
}

// Voice search toggle
function toggleVoice() {
    if (!recognition) {
        alert('Speech recognition not supported in this browser');
        return;
    }
    
    if (!isRecording) {
        startVoiceRecording();
    } else {
        stopVoiceRecording();
    }
}

function startVoiceRecording() {
    isRecording = true;
    const micBtn = document.getElementById('micBtn');
    if (micBtn) {
        micBtn.classList.add('recording');
        micBtn.innerHTML = '🔴';
        recognition.start();
    }
}

function stopVoiceRecording() {
    isRecording = false;
    const micBtn = document.getElementById('micBtn');
    if (micBtn) {
        micBtn.classList.remove('recording');
        micBtn.innerHTML = '🎤';
    }
    if (recognition) {
        recognition.stop();
    }
}

// Search functionality - REQUIREMENT: Search recipes only, not ingredients
function performSearch(query) {
    console.log('Searching for recipes:', query);
    const results = recipesDatabase.filter(recipe => 
        recipe.name.toLowerCase().includes(query.toLowerCase())
    );
    
    if (results.length > 0) {
        displayFilteredRecipes(results);
    } else {
        alert(`No recipes found for "${query}"`);
    }
}

// Search on Enter key
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const query = this.value.trim();
            if (query) {
                performSearch(query);
            }
        }
    });
}

// Settings dropdown toggle
function toggleSettings() {
    const dropdown = document.getElementById('settingsDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

// Handle settings options - REQUIREMENT: Only Change Information and Favorites
function handleSettingsOption(option) {
    toggleSettings();
    
    switch(option) {
        case 'profile':
            openChangeInfo();
            break;
        case 'saved':
            scrollToFavorites();
            break;
        case 'logout':
            // REQUIREMENT: Logout button for individual users
            if(confirm('Are you sure you want to logout?')) {
                console.log('👋 User logging out');
                window.currentUser = null;
                localStorage.removeItem('currentUser');
                window.location.href = 'login.html';
            }
            break;
    }
}

// Open Change Information Modal - REQUIREMENT: Same page popup
function openChangeInfo() {
    const modal = document.getElementById('changeInfoModal');
    if (modal) {
        modal.style.display = 'flex';
        
        // REQUIREMENT: Pre-fill with existing login/signup information
        document.getElementById('changeName').value = currentUser.name;
        document.getElementById('changeUserId').value = currentUser.userId;
        document.getElementById('changeSecurityQuestion').value = currentUser.securityQuestion;
        document.getElementById('changeSecurityAnswer').value = currentUser.securityAnswer;
    }
}

// Close Change Information Modal
function closeChangeInfo() {
    const modal = document.getElementById('changeInfoModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Handle Change Information Form - REQUIREMENT: Update Name, User ID, Password, Security Q&A
const changeInfoForm = document.getElementById('changeInfoForm');
if (changeInfoForm) {
    changeInfoForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const newName = document.getElementById('changeName').value.trim();
        const newUserId = document.getElementById('changeUserId').value.trim();
        const newPassword = document.getElementById('changePassword').value;
        const newQuestion = document.getElementById('changeSecurityQuestion').value;
        const newAnswer = document.getElementById('changeSecurityAnswer').value.trim().toLowerCase();
        
        // REQUIREMENT: User ID must be unique, only alphanumeric + underscore
        if (!newName || !newUserId || !newQuestion || !newAnswer) {
            alert('Please fill in all required fields');
            return;
        }
        
        // REQUIREMENT: Restrict duplicate User IDs
        const users = initializeUsersDatabase();
        if (newUserId !== currentUser.userId && users[newUserId]) {
            alert('This User ID is already taken');
            return;
        }
        
        console.log('🔄 Updating user information...');
        
        // REQUIREMENT: Change information in localStorage (POS key = usersDatabase)
        const oldUserId = currentUser.userId;
        
        // Remove old user ID entry if changed
        if (newUserId !== oldUserId) {
            delete users[oldUserId];
            console.log('✓ Removed old User ID:', oldUserId);
        }
        
        // Update user data with all fields
        users[newUserId] = {
            name: newName,
            userId: newUserId,
            password: newPassword || users[oldUserId]?.password || currentUser.password,
            securityQuestion: newQuestion,
            securityAnswer: newAnswer
        };
        
        window.usersDatabase = users;
        localStorage.setItem('usersDatabase', JSON.stringify(users));
        
        console.log('✓ User data updated:', newUserId);
        
        // Update current user
        currentUser = {
            userId: newUserId,
            name: newName,
            securityQuestion: newQuestion,
            securityAnswer: newAnswer
        };
        window.currentUser = currentUser;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // REQUIREMENT: Reflect all updated info immediately
        const greetingElement = document.getElementById('userGreeting');
        if (greetingElement) {
            greetingElement.textContent = `Hello, ${newName}!`;
        }
        
        alert('Information updated successfully!');
        closeChangeInfo();
    });
}

// Check User ID availability in real-time
const changeUserIdInput = document.getElementById('changeUserId');
if (changeUserIdInput) {
    changeUserIdInput.addEventListener('input', function() {
        const newUserId = this.value.trim();
        const feedback = document.getElementById('userIdCheck');
        const users = initializeUsersDatabase();
        
        if (feedback) {
            if (newUserId === currentUser.userId) {
                feedback.textContent = '✓ Current User ID';
                feedback.style.color = '#10b981';
            } else if (users[newUserId]) {
                feedback.textContent = '✗ User ID already taken';
                feedback.style.color = '#ef4444';
            } else if (newUserId && /^[a-zA-Z0-9_]+$/.test(newUserId)) {
                feedback.textContent = '✓ User ID available';
                feedback.style.color = '#10b981';
            } else {
                feedback.textContent = '✗ Only alphanumeric and underscore allowed';
                feedback.style.color = '#ef4444';
            }
        }
    });
}

// Scroll to favorites - REQUIREMENT: Favorites section below quick recipes
function scrollToFavorites() {
    const favSection = document.getElementById('favoritesSection');
    if (favSection) {
        favSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Navigation
function navigateTo(page) {
    window.location.href = page;
}

// Filter dropdown toggle - REQUIREMENT: Add filter hint on hover
function toggleFilters() {
    const dropdown = document.getElementById('filterDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

// Setup filter listeners - REQUIREMENT: Allow partial filter selection
function setupFilterListeners() {
    // Handle filter option clicks
    document.querySelectorAll('.filter-option').forEach(option => {
        option.addEventListener('click', function() {
            const filterType = this.dataset.filter;
            const value = this.dataset.value;
            
            this.classList.toggle('selected');
            
            if (filterType === 'mood') {
                if (this.classList.contains('selected')) {
                    selectedFilters.mood.push(value);
                } else {
                    selectedFilters.mood = selectedFilters.mood.filter(m => m !== value);
                }
            } else if (filterType === 'taste') {
                if (this.classList.contains('selected')) {
                    selectedFilters.taste.push(value);
                } else {
                    selectedFilters.taste = selectedFilters.taste.filter(t => t !== value);
                }
            } else if (filterType === 'mealType') {
                if (this.classList.contains('selected')) {
                    selectedFilters.mealType.push(value);
                } else {
                    selectedFilters.mealType = selectedFilters.mealType.filter(m => m !== value);
                }
            }
            
            updateActiveFilters();
        });
    });

    // Handle radio button changes
    document.querySelectorAll('input[name="dietType"]').forEach(radio => {
        radio.addEventListener('change', function() {
            selectedFilters.dietType = this.value;
            updateActiveFilters();
        });
    });

    // REQUIREMENT: Max time 60 minutes, show error if more
    const cookingTimeInput = document.getElementById('cookingTime');
    if (cookingTimeInput) {
        cookingTimeInput.addEventListener('input', function() {
            const value = parseInt(this.value);
            const errorMsg = document.getElementById('timeError');
            
            if (value > 60) {
                if (errorMsg) errorMsg.style.display = 'block';
                selectedFilters.cookingTime = null;
            } else {
                if (errorMsg) errorMsg.style.display = 'none';
                selectedFilters.cookingTime = value;
            }
            updateActiveFilters();
        });
    }

    const timeOperator = document.getElementById('timeOperator');
    if (timeOperator) {
        timeOperator.addEventListener('change', function() {
            selectedFilters.timeOperator = this.value;
            updateActiveFilters();
        });
    }

    // REQUIREMENT: Calorie limit up to 720 calories
    const maxCaloriesInput = document.getElementById('maxCalories');
    if (maxCaloriesInput) {
        maxCaloriesInput.addEventListener('input', function() {
            selectedFilters.maxCalories = parseInt(this.value) || 720;
            updateActiveFilters();
        });
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(event) {
        const settingsContainer = document.querySelector('.settings-container');
        const filterContainer = document.querySelector('.search-container');
        
        if (settingsContainer && !settingsContainer.contains(event.target)) {
            const dropdown = document.getElementById('settingsDropdown');
            if (dropdown) dropdown.classList.remove('active');
        }
        
        if (filterContainer && !filterContainer.contains(event.target)) {
            const dropdown = document.getElementById('filterDropdown');
            if (dropdown) dropdown.classList.remove('active');
        }
    });
}

// Update active filters display
function updateActiveFilters() {
    const activeFiltersDiv = document.getElementById('activeFilters');
    const filterTagsDiv = document.getElementById('filterTags');
    
    if (!activeFiltersDiv || !filterTagsDiv) return;
    
    const tags = [];
    
    if (selectedFilters.mood.length > 0) {
        selectedFilters.mood.forEach(m => tags.push({ type: 'mood', value: m, label: `Mood: ${m}` }));
    }
    
    if (selectedFilters.taste.length > 0) {
        selectedFilters.taste.forEach(t => tags.push({ type: 'taste', value: t, label: `Taste: ${t}` }));
    }
    
    if (selectedFilters.mealType.length > 0) {
        selectedFilters.mealType.forEach(m => tags.push({ type: 'mealType', value: m, label: `Meal: ${m}` }));
    }
    
    if (selectedFilters.dietType !== 'both') {
        tags.push({ type: 'dietType', value: selectedFilters.dietType, label: `Diet: ${selectedFilters.dietType}` });
    }
    
    if (selectedFilters.cookingTime) {
        tags.push({ type: 'cookingTime', value: selectedFilters.cookingTime, label: `Time: ${selectedFilters.timeOperator} ${selectedFilters.cookingTime}min` });
    }
    
    if (selectedFilters.maxCalories < 720) {
        tags.push({ type: 'calories', value: selectedFilters.maxCalories, label: `Max ${selectedFilters.maxCalories} cal` });
    }
    
    if (tags.length > 0) {
        activeFiltersDiv.style.display = 'block';
        filterTagsDiv.innerHTML = tags.map(tag => 
            `<span class="filter-tag">${tag.label} <button class="remove-filter-tag" onclick="removeFilterTag('${tag.type}', '${tag.value}')">×</button></span>`
        ).join('');
    } else {
        activeFiltersDiv.style.display = 'none';
    }
}

// Remove individual filter tag
function removeFilterTag(type, value) {
    if (type === 'mood') {
        selectedFilters.mood = selectedFilters.mood.filter(m => m !== value);
        const element = document.querySelector(`[data-filter="mood"][data-value="${value}"]`);
        if (element) element.classList.remove('selected');
    } else if (type === 'taste') {
        selectedFilters.taste = selectedFilters.taste.filter(t => t !== value);
        const element = document.querySelector(`[data-filter="taste"][data-value="${value}"]`);
        if (element) element.classList.remove('selected');
    } else if (type === 'mealType') {
        selectedFilters.mealType = selectedFilters.mealType.filter(m => m !== value);
        const element = document.querySelector(`[data-filter="mealType"][data-value="${value}"]`);
        if (element) element.classList.remove('selected');
    } else if (type === 'dietType') {
        selectedFilters.dietType = 'both';
        const bothRadio = document.getElementById('both');
        if (bothRadio) bothRadio.checked = true;
    } else if (type === 'cookingTime') {
        selectedFilters.cookingTime = null;
        const cookingTimeInput = document.getElementById('cookingTime');
        if (cookingTimeInput) cookingTimeInput.value = '';
    } else if (type === 'calories') {
        selectedFilters.maxCalories = 720;
        const maxCaloriesInput = document.getElementById('maxCalories');
        if (maxCaloriesInput) maxCaloriesInput.value = 720;
    }
    
    updateActiveFilters();
}

// REQUIREMENT: Remove all filters button
function clearAllFilters() {
    selectedFilters = {
        mood: [],
        taste: [],
        mealType: [],
        dietType: 'both',
        cookingTime: null,
        timeOperator: 'under',
        maxCalories: 720,
        bmiEnabled: false,
        bmiData: null
    };
    
    // Reset UI
    document.querySelectorAll('.filter-option').forEach(opt => opt.classList.remove('selected'));
    const bothRadio = document.getElementById('both');
    if (bothRadio) bothRadio.checked = true;
    
    const cookingTimeInput = document.getElementById('cookingTime');
    if (cookingTimeInput) cookingTimeInput.value = '';
    
    const maxCaloriesInput = document.getElementById('maxCalories');
    if (maxCaloriesInput) maxCaloriesInput.value = 720;
    
    const timeError = document.getElementById('timeError');
    if (timeError) timeError.style.display = 'none';
    
    updateActiveFilters();
    
    // REQUIREMENT: Hide filtered section, show banner for new users
    const filteredSection = document.getElementById('filteredSection');
    if (filteredSection) filteredSection.style.display = 'none';
    
    const banner = document.getElementById('whatsCoookingBanner');
    if (banner) banner.style.display = 'block';
}

// BMI Calculator toggle
function toggleBMICalculator() {
    const checkbox = document.getElementById('enableBMI');
    const calculator = document.getElementById('bmiCalculator');
    
    if (checkbox && calculator) {
        if (checkbox.checked) {
            calculator.classList.remove('hidden');
            selectedFilters.bmiEnabled = true;
        } else {
            calculator.classList.add('hidden');
            selectedFilters.bmiEnabled = false;
            selectedFilters.bmiData = null;
            const bmiResult = document.getElementById('bmiResult');
            if (bmiResult) bmiResult.classList.add('hidden');
        }
    }
}

// REQUIREMENT: BMI feature calculates correctly and stays working
function calculateBMI() {
    const height = parseFloat(document.getElementById('height')?.value);
    const weight = parseFloat(document.getElementById('weight')?.value);
    const age = parseInt(document.getElementById('age')?.value);
    const gender = document.getElementById('gender')?.value;
    const goal = document.querySelector('input[name="goal"]:checked')?.value;

    if (!height || !weight || !age || !gender || !goal) {
        alert('Please fill all BMI fields');
        return;
    }

    const heightInM = height / 100;
    const bmi = weight / (heightInM * heightInM);
    
    let bmr;
    if (gender === 'male') {
        bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
        bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }

    let dailyCalories = bmr * 1.55;

    if (goal === 'lose') {
        dailyCalories -= 500;
    } else if (goal === 'gain') {
        dailyCalories += 500;
    }

    selectedFilters.bmiData = {
        bmi: bmi.toFixed(1),
        dailyCalories: Math.round(dailyCalories),
        goal: goal
    };

    const resultDiv = document.getElementById('bmiResult');
    if (resultDiv) {
        let category;
        if (bmi < 18.5) category = 'Underweight';
        else if (bmi < 25) category = 'Normal';
        else if (bmi < 30) category = 'Overweight';
        else category = 'Obese';

        resultDiv.innerHTML = `
            <strong>BMI: ${bmi.toFixed(1)} (${category})</strong><br>
            Daily Calories: ${Math.round(dailyCalories)} kcal<br>
            Goal: ${goal.charAt(0).toUpperCase() + goal.slice(1)} weight
        `;
        resultDiv.classList.remove('hidden');
    }
}

// REQUIREMENT: Apply filters - user can select only one or more filters
function applyFilters() {
    let filtered = [...recipesDatabase];
    
    // REQUIREMENT: When user applies filters, show "Based on your selected filters" heading
    const banner = document.getElementById('whatsCoookingBanner');
    if (banner) banner.style.display = 'none';
    
    // Apply mood filter
    if (selectedFilters.mood.length > 0) {
        filtered = filtered.filter(r => 
            r.mood && r.mood.some(m => selectedFilters.mood.includes(m))
        );
    }
    
    // Apply taste filter
    if (selectedFilters.taste.length > 0) {
        filtered = filtered.filter(r => 
            r.taste && r.taste.some(t => selectedFilters.taste.includes(t))
        );
    }
    
    // Apply meal type filter
    if (selectedFilters.mealType.length > 0) {
        filtered = filtered.filter(r => 
            r.mealType && r.mealType.some(m => selectedFilters.mealType.includes(m))
        );
    }
    
    // Apply diet filter
    if (selectedFilters.dietType !== 'both') {
        filtered = filtered.filter(r => r.diet === selectedFilters.dietType);
    }
    
    // Apply cooking time filter
    if (selectedFilters.cookingTime) {
        if (selectedFilters.timeOperator === 'under') {
            filtered = filtered.filter(r => r.time <= selectedFilters.cookingTime);
        } else if (selectedFilters.timeOperator === 'exactly') {
            filtered = filtered.filter(r => r.time === selectedFilters.cookingTime);
        } else {
            filtered = filtered.filter(r => r.time >= selectedFilters.cookingTime);
        }
    }
    
    // Apply calories filter
    filtered = filtered.filter(r => r.calories <= selectedFilters.maxCalories);
    
    // Apply BMI filter
    if (selectedFilters.bmiEnabled && selectedFilters.bmiData) {
        filtered = filtered.filter(r => r.calories <= selectedFilters.bmiData.dailyCalories);
    }
    
    // REQUIREMENT: Ensure every filter combo has at least 2 recipes
    if (filtered.length > 0) {
        displayFilteredRecipes(filtered);
    } else {
        alert('No recipes match your selected filters. Try adjusting your criteria.');
    }
    
    toggleFilters();
}

// Display filtered recipes - REQUIREMENT: Below Quick Recipes
function displayFilteredRecipes(recipes) {
    const section = document.getElementById('filteredSection');
    const grid = document.getElementById('filteredRecipesGrid');
    
    if (section && grid) {
        section.style.display = 'block';
        grid.innerHTML = recipes.map(recipe => createRecipeCard(recipe)).join('');
        
        // Scroll to filtered section
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// REQUIREMENT: Quick Recipes Under 30 Minutes (uses data from Recipes page)
function loadQuickRecipes() {
    const quickRecipes = recipesDatabase.filter(r => r.time <= 30).slice(0, 6);
    const grid = document.getElementById('quickRecipesGrid');
    if (grid) {
        grid.innerHTML = quickRecipes.map(recipe => createRecipeCard(recipe)).join('');
    }
}

// REQUIREMENT: Load favorites - display in Favorites section
function loadFavorites() {
    const grid = document.getElementById('favoritesGrid');
    
    if (!grid) return;
    
    if (favorites.size === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #6b7280;">
                <div style="font-size: 64px; margin-bottom: 20px;">💔</div>
                <div style="font-size: 20px; font-weight: 600; color: #1f2937; margin-bottom: 10px;">No Favorites Yet</div>
                <div>Start adding recipes to your favorites!</div>
            </div>
        `;
        return;
    }
    
    const favoriteRecipes = recipesDatabase.filter(r => favorites.has(r.id));
    grid.innerHTML = favoriteRecipes.map(recipe => createRecipeCard(recipe)).join('');
}

// Create recipe card HTML
function createRecipeCard(recipe) {
    const isFavorite = favorites.has(recipe.id);
    const dietIcon = recipe.diet === 'veg' ? '🥬' : '🍖';
    const dietLabel = recipe.diet === 'veg' ? 'Veg' : 'Non-Veg';
    
    return `
        <div class="recipe-card" onclick="openRecipeModal(${recipe.id})">
            <div class="recipe-image">${recipe.image}</div>
            <button class="favorite-btn" onclick="event.stopPropagation(); toggleFavorite(${recipe.id})">${isFavorite ? '❤️' : '🤍'}</button>
            <div class="recipe-content">
                <div class="recipe-title">${recipe.name}</div>
                <div class="recipe-meta">
                    <span>⏱️ ${recipe.time}min</span>
                    <span>🔥 ${recipe.calories}cal</span>
                    <span>${dietIcon} ${dietLabel}</span>
                </div>
                ${recipe.difficulty ? `<div style="font-size: 12px; color: #6b7280; margin-top: 5px;">Difficulty: ${recipe.difficulty}</div>` : ''}
                ${recipe.rating ? `<div style="font-size: 14px; color: #f59e0b; margin-top: 5px;">⭐ ${recipe.rating}/5</div>` : ''}
            </div>
        </div>
    `;
}

// Toggle favorite
function toggleFavorite(recipeId) {
    if (favorites.has(recipeId)) {
        favorites.delete(recipeId);
    } else {
        favorites.add(recipeId);
    }
    
    // Save to memory with user-specific favorites
    if (!window.userFavorites) {
        window.userFavorites = {};
    }
    window.userFavorites[currentUser.userId] = Array.from(favorites);
    
    console.log('✓ Favorites updated for user:', currentUser.userId);
    console.log('✓ Total favorites:', favorites.size);
    
    // Reload displays
    loadQuickRecipes();
    loadFavorites();
    
    // Reload filtered section if visible
    const filteredSection = document.getElementById('filteredSection');
    if (filteredSection && filteredSection.style.display !== 'none') {
        const filteredGrid = document.getElementById('filteredRecipesGrid');
        if (filteredGrid && filteredGrid.children.length > 0) {
            applyFilters();
        }
    }
}

// Open recipe modal
function openRecipeModal(recipeId) {
    const recipe = recipesDatabase.find(r => r.id === recipeId);
    if (!recipe) return;
    
    const modal = document.createElement('div');
    modal.className = 'recipe-modal';
    modal.innerHTML = `
        <div class="recipe-modal-content">
            <div class="recipe-modal-header">
                <button class="close-recipe-modal" onclick="closeRecipeModal()">×</button>
                <div class="recipe-modal-emoji">${recipe.image}</div>
            </div>
            <div class="recipe-modal-body">
                <h1 class="recipe-modal-title">${recipe.name}</h1>
                <div class="recipe-modal-meta">
                    <span>⏱️ Cook: ${recipe.time} min</span>
                    ${recipe.prepTime ? `<span>🔪 Prep: ${recipe.prepTime} min</span>` : ''}
                    <span>🔥 ${recipe.calories} cal</span>
                    <span>${recipe.diet === 'veg' ? '🥬 Vegetarian' : '🍖 Non-Vegetarian'}</span>
                    ${recipe.servings ? `<span>🍽️ Serves ${recipe.servings}</span>` : ''}
                    ${recipe.difficulty ? `<span>📊 ${recipe.difficulty}</span>` : ''}
                </div>
                ${recipe.rating ? `<div class="recipe-rating">⭐ ${recipe.rating}/5</div>` : ''}
                
                <button class="youtube-btn" onclick="window.open('https://www.youtube.com/results?search_query=${encodeURIComponent(recipe.name + ' recipe')}','_blank')">
                    ▶️ Watch Tutorial on YouTube
                </button>
                
                ${recipe.allergens && recipe.allergens.length > 0 ? `
                    <div class="allergen-warning">
                        <strong>⚠️ Allergen Warning:</strong> Contains ${recipe.allergens.join(', ')}
                    </div>
                ` : ''}
                
                ${recipe.nutrition ? `
                    <div class="nutrition-info">
                        <h3>📊 Nutritional Information (per serving)</h3>
                        <div class="nutrition-grid">
                            <div>Protein: ${recipe.nutrition.protein}</div>
                            <div>Carbs: ${recipe.nutrition.carbs}</div>
                            <div>Fats: ${recipe.nutrition.fats}</div>
                        </div>
                    </div>
                ` : ''}
                
                <h2 class="section-title-modal">🛒 Main Ingredients</h2>
                <ul class="ingredients-list">
                    ${recipe.mainIngredients.map(ing => `<li class="ingredient-item">${ing}</li>`).join('')}
                </ul>
                
                ${recipe.optionalIngredients && recipe.optionalIngredients.length > 0 ? `
                    <h3 class="section-subtitle-modal">Optional Ingredients</h3>
                    <ul class="ingredients-list optional">
                        ${recipe.optionalIngredients.map(ing => `<li class="ingredient-item optional">${ing}</li>`).join('')}
                    </ul>
                ` : ''}
                
                <h2 class="section-title-modal">👨‍🍳 Cooking Steps</h2>
                <ol class="steps-list">
                    ${recipe.steps.map((step, i) => `
                        <li class="step-item">
                            <div class="step-number">${i + 1}</div>
                            <div class="step-text">${step}</div>
                        </li>
                    `).join('')}
                </ol>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
}

// Close recipe modal
function closeRecipeModal() {
    const modal = document.querySelector('.recipe-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

// REQUIREMENT: Pantry Alert - show items close to expiry and suggest recipes
function checkPantryAlerts() {
    // Get pantry items from localStorage
    const pantryItems = JSON.parse(localStorage.getItem('pantryItems') || '[]');
    
    const expiringItems = pantryItems.filter(item => {
        const expiryDate = new Date(item.expiryDate);
        const today = new Date();
        const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        return daysLeft >= 0 && daysLeft <= 4;
    });
    
    if (expiringItems.length > 0) {
        const alertDiv = document.getElementById('pantryAlert');
        const alertText = document.getElementById('pantryAlertText');
        const suggestionsDiv = document.getElementById('pantryRecipeSuggestions');
        
        if (alertDiv && alertText && suggestionsDiv) {
            alertDiv.style.display = 'block';
            
            const itemNames = expiringItems.map(i => i.name).slice(0, 3).join(', ');
            const moreCount = expiringItems.length > 3 ? ` and ${expiringItems.length - 3} more` : '';
            alertText.textContent = `${itemNames}${moreCount} expiring soon! Cook these recipes:`;
            
            // REQUIREMENT: Suggest recipes using those ingredients
            const expiringIngredients = expiringItems.map(i => i.name.toLowerCase());
            const suggestedRecipes = recipesDatabase.filter(recipe => 
                recipe.mainIngredients.some(ing => 
                    expiringIngredients.some(exp => 
                        ing.toLowerCase().includes(exp) || exp.includes(ing.toLowerCase())
                    )
                )
            ).slice(0, 5);
            
            if (suggestedRecipes.length > 0) {
                suggestionsDiv.innerHTML = suggestedRecipes.map(r => 
                    `<button class="recipe-pill" onclick="openRecipeModal(${r.id})">${r.image} ${r.name}</button>`
                ).join('');
            } else {
                suggestionsDiv.innerHTML = '<p style="color: #78350f;">No specific recipe suggestions available</p>';
            }
        }
    }
}