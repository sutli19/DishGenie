// ==========================================
// FORGOT-PASSWORD.JS with localStorage persistence
// ==========================================

function getUsersDatabase() {
    return JSON.parse(localStorage.getItem('usersDatabase') || '{}');
}
function setUsersDatabase(db) {
    localStorage.setItem('usersDatabase', JSON.stringify(db));
}

function togglePassword(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = '🙈';
    } else {
        input.type = 'password';
        icon.textContent = '👁️';
    }
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
    const password = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;
    const feedback = document.getElementById('passwordMatch');
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

let currentUserId = '';

document.getElementById('userIdForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const userId = document.getElementById('userId').value.trim();
    const users = getUsersDatabase();
    if (!userId) {
        alert('Please enter your User ID');
        return;
    }
    if (!users[userId]) {
        alert('User ID not found. Please check your User ID or sign up.');
        return;
    }
    currentUserId = userId;
    document.getElementById('userIdForm').style.display = 'none';
    document.getElementById('securityForm').style.display = 'block';
    document.getElementById('securityQuestionText').textContent = users[userId].securityQuestion;
});

document.getElementById('securityForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const answer = document.getElementById('securityAnswer').value.trim().toLowerCase();
    const users = getUsersDatabase();
    const user = users[currentUserId];
    if (!answer) {
        alert('Please enter your answer');
        return;
    }
    if (answer !== user.securityAnswer) {
        alert('Incorrect answer. Please try again.');
        return;
    }
    document.getElementById('securityForm').style.display = 'none';
    document.getElementById('resetPasswordForm').style.display = 'block';
});

document.getElementById('resetPasswordForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;
    if (!newPassword || !confirmPassword) {
        alert('Please fill in all fields');
        return;
    }
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
        alert(passwordError);
        return;
    }
    if (newPassword !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    const users = getUsersDatabase();
    users[currentUserId].password = newPassword;
    setUsersDatabase(users);
    alert('Password reset successful! You can now login with your new password.');
    window.location.href = 'login.html';
});

// Real-time password match checking
document.getElementById('confirmNewPassword').addEventListener('input', checkPasswordMatch);
document.getElementById('newPassword').addEventListener('input', function() {
    if (document.getElementById('confirmNewPassword').value) {
        checkPasswordMatch();
    }
});
