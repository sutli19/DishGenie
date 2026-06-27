// ==========================================
// SIGNUP.JS with localStorage persistence
// ==========================================

function togglePassword(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
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

function validatePassword(password) {
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(password)) return "Must include uppercase letter";
    if (!/[a-z]/.test(password)) return "Must include lowercase letter";
    if (!/[0-9]/.test(password)) return "Must include number";
    if (!/[!@#$%^&*]/.test(password)) return "Must include special character";
    return "";
}

function checkPasswordMatch() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const feedback = document.getElementById('passwordMatch');
    if (!feedback) return false;
    if (!confirmPassword) {
        feedback.textContent = '';
        return false;
    }
    if (password === confirmPassword) {
        feedback.textContent = '✓ Passwords match';
        feedback.style.color = '#10b981';
        return true;
    } else {
        feedback.textContent = '✗ Passwords do not match';
        feedback.style.color = '#ef4444';
        return false;
    }
}

function checkUserIdAvailability() {
    const userId = document.getElementById('userId').value.trim();
    const feedback = document.getElementById('userIdFeedback');
    if (!feedback) return false;
    if (!userId) {
        feedback.textContent = '';
        return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(userId)) {
        feedback.textContent = '✗ Only letters, numbers, underscore';
        feedback.style.color = '#ef4444';
        return false;
    }
    const usersDatabase = loadUsersDatabase();
    if (usersDatabase[userId]) {
        feedback.textContent = '✗ User ID taken';
        feedback.style.color = '#ef4444';
        return false;
    }
    feedback.textContent = '✓ Available';
    feedback.style.color = '#10b981';
    return true;
}

document.getElementById('signupForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const fullName = document.getElementById('fullName').value.trim();
    const userId = document.getElementById('userId').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const securityQuestion = document.getElementById('securityQuestion').value;
    const securityAnswer = document.getElementById('securityAnswer').value.trim().toLowerCase();

    if (!fullName || fullName.length < 2) {
        alert('Please enter your full name');
        return;
    }
    if (!userId || !/^[a-zA-Z0-9_]+$/.test(userId)) {
        alert('User ID can only contain letters, numbers, and underscores');
        return;
    }
    let usersDatabase = loadUsersDatabase();
    if (usersDatabase[userId]) {
        alert('This User ID is already taken');
        return;
    }
    const passError = validatePassword(password);
    if (passError) {
        alert(passError);
        return;
    }
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    if (!securityQuestion) {
        alert('Please select a security question');
        return;
    }
    if (!securityAnswer || securityAnswer.length < 2) {
        alert('Please provide a security answer');
        return;
    }
    const btn = document.getElementById('signupBtn');
    const btnText = document.getElementById('signupBtnText');
    const spinner = document.getElementById('signupSpinner');
    if (btn) btn.disabled = true;
    if (btnText) btnText.textContent = 'Creating...';
    if (spinner) spinner.classList.remove('hidden');
    setTimeout(() => {
        usersDatabase[userId] = {
            name: fullName,
            userId: userId,
            password: password,
            securityQuestion: securityQuestion,
            securityAnswer: securityAnswer
        };
        saveUsersDatabase(usersDatabase);
        window.currentUser = {
            userId: userId,
            name: fullName,
            securityQuestion: securityQuestion,
            securityAnswer: securityAnswer
        };
        localStorage.setItem('currentUser', JSON.stringify(window.currentUser));
        alert('Account created! Welcome, ' + fullName + '!');
        window.location.href = 'dashboard.html';
    }, 1000);
});

// Real-time checks
document.getElementById('confirmPassword').addEventListener('input', checkPasswordMatch);
document.getElementById('password').addEventListener('input', function() {
    if (document.getElementById('confirmPassword').value) {
        checkPasswordMatch();
    }
});
document.getElementById('userId').addEventListener('input', checkUserIdAvailability);
