// ==========================================
// LOGIN.JS with localStorage persistence
// ==========================================

function togglePassword() {
    const input = document.getElementById('password');
    const icon = document.getElementById('eyeIcon');
    if (input && icon) {
        if (input.type === 'password') {
            input.type = 'text';
            icon.textContent = '🙈';
        } else {
            input.type = 'password';
            icon.textContent = '👁️';
        }
    }
}

function loadUsersDatabase() {
    const data = localStorage.getItem('usersDatabase');
    return data ? JSON.parse(data) : {};
}

function saveUsersDatabase(db) {
    localStorage.setItem('usersDatabase', JSON.stringify(db));
}

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const userId = document.getElementById('userId').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    if (!userId) {
        alert('Please enter your User ID');
        return;
    }
    if (!password) {
        alert('Please enter your password');
        return;
    }

    const btn = document.getElementById('loginBtn');
    const btnText = document.getElementById('loginBtnText');
    const spinner = document.getElementById('loginSpinner');
    if (btn) btn.disabled = true;
    if (btnText) btnText.textContent = 'Logging in...';
    if (spinner) spinner.classList.remove('hidden');

    setTimeout(() => {
        const usersDatabase = loadUsersDatabase();

        if (!usersDatabase[userId]) {
            if (btn) btn.disabled = false;
            if (btnText) btnText.textContent = 'Login';
            if (spinner) spinner.classList.add('hidden');
            alert('User ID not found. Please sign up first.');
            return;
        }
        if (usersDatabase[userId].password !== password) {
            if (btn) btn.disabled = false;
            if (btnText) btnText.textContent = 'Login';
            if (spinner) spinner.classList.add('hidden');
            alert('Incorrect password');
            return;
        }

        window.currentUser = {
            userId: userId,
            name: usersDatabase[userId].name,
            securityQuestion: usersDatabase[userId].securityQuestion,
            securityAnswer: usersDatabase[userId].securityAnswer
        };
        localStorage.setItem('currentUser', JSON.stringify(window.currentUser));

        if (rememberMe) {
            window.rememberedUser = userId;
        }

        alert(`Login successful! Welcome, ${usersDatabase[userId].name}!`);

        window.location.href = 'dashboard.html';
    }, 1000);
});
