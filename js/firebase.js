// Firebase initialization
// Load Firebase configuration from config.js
// This prevents API keys from being exposed in the public repository
fetch('config.js')
    .then(response => {
        console.log('Config fetch response:', response);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(config => {
        console.log('Loaded config:', config);
        
        // Validate config structure
        if (!config || typeof config !== 'object') {
            throw new Error('Invalid configuration format');
        }
        
        const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId', 'databaseURL'];
        for (const field of requiredFields) {
            if (!config[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        
        console.log('Initializing Firebase with config...');
        // Initialize Firebase with validated config
        firebase.initializeApp(config);
        console.log('Firebase initialized successfully');
        
        // Test database connection
        setTimeout(() => {
            if (firebase.database) {
                console.log('Firebase database available, loading highscores...');
                getPublicHighscores();
            }
        }, 1000);
    })
    .catch(error => {
        console.error('Error loading Firebase configuration:', error);
        console.error('Error details:', error.stack);
        
        // Fallback: try to initialize without config file (if running locally)
        if (error.message.includes('fetch')) {
            console.log('Fetch failed, trying fallback config...');
            try {
                const fallbackConfig = {
                    "apiKey": "AIzaSyDv2Aow7VEUnFXglySeGG-EylH78UJVt7c",
                    "authDomain": "spacetris-cc8ec.firebaseapp.com",
                    "databaseURL": "https://spacetris-cc8ec-default-rtdb.europe-west1.firebasedatabase.app",
                    "projectId": "spacetris-cc8ec",
                    "storageBucket": "spacetris-cc8ec.firebasestorage.app",
                    "messagingSenderId": "866701367465",
                    "appId": "1:866701367465:web:e5d22916bb27355cbdf1b8"
                };
                firebase.initializeApp(fallbackConfig);
                console.log('Firebase initialized with fallback config');
                getPublicHighscores();
            } catch (fallbackError) {
                console.error('Fallback initialization failed:', fallbackError);
                alert('Firebase configuration could not be loaded. High scores will not be available.');
            }
        } else {
            alert('Firebase configuration could not be loaded. High scores will not be available.');
        }
    });

// High score management
function submitScore(name, score) {
    if (!firebase.database) {
        console.warn('Firebase database not available');
        return Promise.reject(new Error('Database not available'));
    }
    
    // Validate inputs
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw new Error('Invalid name provided');
    }
    if (typeof score !== 'number' || score < 0) {
        throw new Error('Invalid score provided');
    }
    
    const sanitizedName = name.trim().substring(0, 30);
    
    return firebase.database().ref('highscores').push({
        name: sanitizedName,
        score: Math.floor(score),
        timestamp: Date.now()
    }).then(() => {
        getPublicHighscores();
    }).catch(error => {
        console.error('Error submitting score:', error);
        throw error;
    });
}

function getPublicHighscores() {
    if (!firebase.database) {
        console.warn('Firebase database not available');
        updatePublicHighscoresDisplay([]);
        return Promise.resolve([]);
    }
    
    const highscoresRef = firebase.database().ref('highscores');
    return highscoresRef.orderByChild('score')
        .limitToLast(25)
        .once('value')
        .then(snapshot => {
            const highscores = [];
            snapshot.forEach(child => {
                const data = child.val();
                if (data && typeof data.score === 'number' && data.name) {
                    highscores.push({ id: child.key, ...data });
                }
            });
            highscores.sort((a, b) => b.score - a.score);
            updatePublicHighscoresDisplay(highscores);
            return highscores;
        })
        .catch(error => {
            console.error('Error fetching highscores:', error);
            updatePublicHighscoresDisplay([]);
            throw error;
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