let appState = {
    currentPage: 'homePage',
    darkMode: false,
    selectedMood: 'neutral',
    selectedMoodEmoji: '😐'
};

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    updateGreeting();
    updateCurrentDate();
});

function initializeApp() {
    const savedState = localStorage.getItem('mindNepalState');
    if (savedState) {
        appState = { ...appState, ...JSON.parse(savedState) };
    }

    if (appState.darkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
        document.getElementById('darkModeToggle').checked = true;
    }

    document.getElementById('themeToggle').addEventListener('click', toggleDarkMode);
    document.getElementById('darkModeToggle').addEventListener('change', toggleDarkMode);
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        appState.currentPage = pageId;
        
        const pageTitles = {
            'homePage': 'Home',
            'moodPage': 'Mood',
            'journalPage': 'Journal',
            'meditationPage': 'Meditation',
            'communityPage': 'Community',
            'profilePage': 'Profile'
        };
        document.getElementById('headerTitle').textContent = pageTitles[pageId] || 'MindNepal';
        
        switch(pageId) {
            case 'moodPage':
                loadMoodHistory();
                break;
            case 'journalPage':
                loadJournalEntries();
                break;
            case 'meditationPage':
                loadMeditationSessions('recommended');
                break;
            case 'profilePage':
                loadProfileData();
                break;
        }
        
        saveAppState();
    }
}

function toggleDarkMode() {
    appState.darkMode = !appState.darkMode;
    document.body.classList.toggle('dark-mode', appState.darkMode);
    
    const icon = document.getElementById('themeToggle').querySelector('i');
    icon.className = appState.darkMode ? 'fas fa-sun' : 'fas fa-moon';
    
    document.getElementById('darkModeToggle').checked = appState.darkMode;
    saveAppState();
}

function updateGreeting() {
    const greetingEl = document.getElementById('greetingText');
    if (!greetingEl) return;

    const hour = new Date().getHours();
    let greeting = 'Good ';

    if (hour < 12) greeting += 'Morning';
    else if (hour < 18) greeting += 'Afternoon';
    else greeting += 'Evening';

    if (currentUser && currentUser.displayName) {
        greetingEl.textContent = `${greeting}, ${currentUser.displayName.split(' ')[0]}!`;
    } else {
        greetingEl.textContent = `${greeting}!`;
    }
}

function updateCurrentDate() {
    const dateEl = document.getElementById('currentDate');
    if (!dateEl) return;

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.textContent = new Date().toLocaleDateString('en-US', options);
}

function selectMood(mood, emoji) {
    appState.selectedMood = mood;
    appState.selectedMoodEmoji = emoji;
    
    document.querySelectorAll('.mood-option').forEach(option => {
        option.classList.remove('active');
    });
    event.target.closest('.mood-option').classList.add('active');
}

function selectMoodForEntry(mood, emoji) {
    appState.selectedMood = mood;
    appState.selectedMoodEmoji = emoji;
    
    document.querySelectorAll('#moodPage .mood-option').forEach(option => {
        option.classList.remove('active');
    });
    event.target.closest('.mood-option').classList.add('active');
}

function saveMoodEntry() {
    const note = document.getElementById('moodNote').value;
    
    if (!appState.selectedMood) {
        alert('Please select a mood');
        return;
    }

    const moodData = {
        mood: appState.selectedMood,
        emoji: appState.selectedMoodEmoji,
        note: note,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        userId: currentUser.uid
    };

    db.collection('moodEntries').add(moodData)
        .then(() => {
            db.collection('users').doc(currentUser.uid).update({
                moodEntries: firebase.firestore.FieldValue.increment(1)
            });
            
            document.getElementById('moodNote').value = '';
            alert('Mood saved successfully!');
            loadMoodHistory();
        })
        .catch((error) => {
            alert('Error saving mood. Please try again.');
        });
}

function loadMoodHistory() {
    const moodHistory = document.getElementById('moodHistory');

    db.collection('moodEntries')
        .where('userId', '==', currentUser.uid)
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get()
        .then((querySnapshot) => {
            moodHistory.innerHTML = '';
            
            if (querySnapshot.empty) {
                moodHistory.innerHTML = '<p class="text-center text-secondary">No mood entries yet.</p>';
                return;
            }

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const entry = document.createElement('div');
                entry.className = 'mood-entry';
                entry.innerHTML = `
                    <div class="mood-emoji-large">${data.emoji}</div>
                    <div class="flex-1">
                        <div class="d-flex justify-between align-center">
                            <h5>${data.mood.charAt(0).toUpperCase() + data.mood.slice(1)} Mood</h5>
                            <span class="text-sm text-light">${formatDate(data.timestamp?.toDate())}</span>
                        </div>
                        <p class="text-sm text-secondary">${data.note || 'No additional notes'}</p>
                    </div>
                `;
                moodHistory.appendChild(entry);
            });
        })
        .catch((error) => {
            moodHistory.innerHTML = '<p class="text-center text-secondary">Error loading mood history</p>';
        });
}

function saveJournalEntry() {
    const content = document.getElementById('journalEntry').value;
    
    if (!content.trim()) {
        alert('Please write something in your journal');
        return;
    }

    const journalData = {
        content: content,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        userId: currentUser.uid
    };

    db.collection('journalEntries').add(journalData)
        .then(() => {
            db.collection('users').doc(currentUser.uid).update({
                journalEntries: firebase.firestore.FieldValue.increment(1)
            });
            
            document.getElementById('journalEntry').value = '';
            alert('Journal entry saved successfully!');
            loadJournalEntries();
        })
        .catch((error) => {
            alert('Error saving journal entry. Please try again.');
        });
}

function loadJournalEntries() {
    const journalEntries = document.getElementById('journalEntries');

    db.collection('journalEntries')
        .where('userId', '==', currentUser.uid)
        .orderBy('timestamp', 'desc')
        .limit(5)
        .get()
        .then((querySnapshot) => {
            journalEntries.innerHTML = '';
            
            if (querySnapshot.empty) {
                journalEntries.innerHTML = '<p class="text-center text-secondary">No journal entries yet.</p>';
                return;
            }

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const entry = document.createElement('div');
                entry.className = 'entry';
                entry.innerHTML = `
                    <div class="entry-header">
                        <h5>Journal Entry</h5>
                        <span class="text-sm text-light">${formatDate(data.timestamp?.toDate())}</span>
                    </div>
                    <p class="text-md">${data.content}</p>
                `;
                journalEntries.appendChild(entry);
            });
        })
        .catch((error) => {
            journalEntries.innerHTML = '<p class="text-center text-secondary">Error loading journal entries</p>';
        });
}

function loadMeditationSessions(category) {
    const sessionsContainer = document.getElementById('meditationSessions');
    const categoryTitle = document.getElementById('sessionCategoryTitle');
    
    const categoryTitles = {
        'sleep': 'Sleep Meditation',
        'anxiety': 'Anxiety Relief',
        'focus': 'Focus & Concentration',
        'stress': 'Stress Management',
        'recommended': 'Recommended Sessions'
    };
    
    categoryTitle.textContent = categoryTitles[category] || 'Meditation Sessions';

    const sessions = {
        'sleep': [
            { name: 'Deep Sleep Journey', duration: 15, description: 'Guided meditation for restful sleep' },
            { name: 'Sleep Relaxation', duration: 10, description: 'Calm your mind before bed' }
        ],
        'anxiety': [
            { name: 'Anxiety Release', duration: 12, description: 'Let go of anxious thoughts' },
            { name: 'Calm Breathing', duration: 8, description: 'Breathing exercises for anxiety' }
        ],
        'focus': [
            { name: 'Focus Enhancement', duration: 10, description: 'Improve concentration and focus' },
            { name: 'Mindful Work', duration: 15, description: 'Meditation for productivity' }
        ],
        'stress': [
            { name: 'Stress Relief', duration: 12, description: 'Release tension and stress' },
            { name: 'Body Scan Relaxation', duration: 18, description: 'Full body relaxation technique' }
        ],
        'recommended': [
            { name: 'Morning Mindfulness', duration: 10, description: 'Start your day with clarity' },
            { name: 'Evening Wind Down', duration: 12, description: 'Perfect way to end your day' }
        ]
    };

    sessionsContainer.innerHTML = '';
    const categorySessions = sessions[category] || sessions['recommended'];
    
    categorySessions.forEach(session => {
        const sessionItem = document.createElement('div');
        sessionItem.className = 'session-item';
        sessionItem.innerHTML = `
            <div>
                <h5>${session.name}</h5>
                <p class="text-sm text-secondary">${session.description}</p>
            </div>
            <button class="btn btn-primary btn-sm" onclick="startMeditation('${session.name}', ${session.duration})">
                Start (${session.duration}m)
            </button>
        `;
        sessionsContainer.appendChild(sessionItem);
    });
}

function startMeditation(sessionName, duration) {
    const meditationData = {
        sessionName: sessionName,
        duration: duration,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        userId: currentUser.uid
    };

    db.collection('meditationSessions').add(meditationData)
        .then(() => {
            db.collection('users').doc(currentUser.uid).update({
                meditationSessions: firebase.firestore.FieldValue.increment(1)
            });
            
            alert(`Starting ${sessionName} for ${duration} minutes...`);
        })
        .catch((error) => {
            console.error('Error recording meditation:', error);
        });
}

function loadCommunityPosts(category) {
    const postsContainer = document.getElementById('communityPosts');

    document.querySelectorAll('.community-tabs .chip').forEach(chip => {
        chip.classList.remove('active');
    });
    event.target.classList.add('active');
}

function createCommunityPost() {
    const content = document.getElementById('communityPost').value;
    
    if (!content.trim()) {
        alert('Please write something to share');
        return;
    }

    alert('Post shared to community!');
    document.getElementById('communityPost').value = '';
}

function loadProfileData() {
    if (!currentUser) return;

    document.getElementById('profileName').textContent = currentUser.displayName || 'User';
    document.getElementById('profileEmail').textContent = currentUser.email;
    document.getElementById('profileAvatar').textContent = currentUser.displayName ? 
        currentUser.displayName.charAt(0).toUpperCase() : 'U';

    db.collection('users').doc(currentUser.uid).get()
        .then((doc) => {
            if (doc.exists) {
                const data = doc.data();
                document.getElementById('moodCount').textContent = data.moodEntries || 0;
                document.getElementById('journalCount').textContent = data.journalEntries || 0;
                document.getElementById('meditationCount').textContent = data.meditationSessions || 0;
            }
        })
        .catch((error) => {
            console.error('Error loading profile data:', error);
        });
}

function showHelpSupport() {
    alert('Help & support coming soon!');
}

function loadUserData() {
    loadProfileData();
}

function formatDate(date) {
    if (!date) return 'Recently';
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function saveAppState() {
    localStorage.setItem('mindNepalState', JSON.stringify(appState));
}

loadMeditationSessions('recommended');