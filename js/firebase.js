// Firebase initialization
// Load Firebase configuration from config.js
// This prevents API keys from being exposed in the public repository
fetch('config.js')
    .then(response => response.text())
    .then(script => {
        // Execute the config script to set up the Firebase configuration
        eval(script);
        
        // Initialize Firebase after config is loaded
        const firebaseConfigElement = document.getElementById('firebase-config');
        if (firebaseConfigElement) {
            const firebaseConfig = {
                apiKey: firebaseConfigElement.getAttribute('data-api-key'),
                authDomain: firebaseConfigElement.getAttribute('data-auth-domain'),
                projectId: firebaseConfigElement.getAttribute('data-project-id'),
                storageBucket: firebaseConfigElement.getAttribute('data-storage-bucket'),
                messagingSenderId: firebaseConfigElement.getAttribute('data-messaging-sender-id'),
                appId: firebaseConfigElement.getAttribute('data-app-id'),
                databaseURL: firebaseConfigElement.getAttribute('data-database-url')
            };
            firebase.initializeApp(firebaseConfig);
        } else {
            console.error('Firebase configuration element not found');
            alert('Firebase configuration not found. High scores will not be available.');
        }
    })
    .catch(error => {
        console.error('Error loading Firebase configuration:', error);
        alert('Firebase configuration could not be loaded. High scores will not be available.');
    });

// High score management
function submitScore(name, score) {
    if (!firebase.database) return;
    
    firebase.database().ref('highscores').push({
        name: name,
        score: score,
        timestamp: Date.now()
    }).then(() => {
        getPublicHighscores();
    });
}

function getPublicHighscores() {
    if (!firebase.database) return;
    
    const highscoresRef = firebase.database().ref('highscores');
    highscoresRef.orderByChild('score')
        .limitToLast(25)
        .once('value')
        .then(snapshot => {
            const highscores = [];
            snapshot.forEach(child => {
                highscores.push({ id: child.key, ...child.val() });
            });
            highscores.sort((a, b) => b.score - a.score);
            updatePublicHighscoresDisplay(highscores);
        });
}

function updatePublicHighscoresDisplay(highscores) {
    const list = document.getElementById('publicHighscoresList');
    list.innerHTML = '<div>' +
        '<span>RANK</span>' +
        '<span>NAME</span>' +
        '<span>SCORE</span></div>';
    
    if (highscores.length === 0) {
        list.innerHTML += '<div id="loadingScores">NO SCORES YET</div>';
    } else {
        highscores.forEach((score, index) => {
            const item = document.createElement('div');
            item.style.display = 'flex';
            item.style.justifyContent = 'space-between';
            item.style.padding = '5px 0';
            item.style.borderBottom = '1px solid rgba(255, 255, 0, 0.3)';
            item.style.fontSize = '12px';
            if (index < 3) {
                item.style.color = '#ffff00';
                item.style.textShadow = '0 0 5px #ffff00';
            }
            item.innerHTML = `
                <span style="width: 20%; text-align: center">${index + 1}.</span>
                <span style="width: 50%; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">${score.name || 'Anonymous'}</span>
                <span style="width: 30%; text-align: right">${score.score}</span>
            `;
            list.appendChild(item);
        });
    }
}

// Initialize high scores when the page loads
document.addEventListener('DOMContentLoaded', getPublicHighscores); 