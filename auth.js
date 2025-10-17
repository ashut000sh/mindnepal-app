let currentUser = null;

function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
}

function showSignup() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
}

function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorElement = document.getElementById('loginError');

    if (!email || !password) {
        showError(errorElement, 'Please fill in all fields');
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            currentUser = userCredential.user;
            showMainApp();
            loadUserData();
        })
        .catch((error) => {
            showError(errorElement, error.message);
        });
}

function signup() {
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const errorElement = document.getElementById('signupError');

    if (!name || !email || !password) {
        showError(errorElement, 'Please fill in all fields');
        return;
    }

    if (password.length < 6) {
        showError(errorElement, 'Password must be at least 6 characters');
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            currentUser = userCredential.user;
            return currentUser.updateProfile({ displayName: name });
        })
        .then(() => {
            return db.collection('users').doc(currentUser.uid).set({
                name: name,
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                moodEntries: 0,
                journalEntries: 0,
                meditationSessions: 0
            });
        })
        .then(() => {
            showMainApp();
            loadUserData();
        })
        .catch((error) => {
            showError(errorElement, error.message);
        });
}

function logout() {
    auth.signOut().then(() => {
        currentUser = null;
        showAuthPage();
    });
}

function showError(element, message) {
    element.textContent = message;
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

function showAuthPage() {
    document.getElementById('authPage').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
}

function showMainApp() {
    document.getElementById('authPage').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
}

auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        showMainApp();
        loadUserData();
    } else {
        showAuthPage();
    }
});