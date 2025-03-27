// Game state
let canvas, ctx;
let player;
let bullets = [];
let enemies = [];
let powerUps = [];
let score = 0;
let gameLoop;
let isGameOver = false;
let isPaused = false;
let currentLevel = 1;
let enemySpeed = 2;
let spawnRate = 2000;
let lastSpawn = 0;
let lastPowerUpSpawn = 0;
let powerUpSpawnRate = 10000;
let playerName = 'ANONYMOUS';
let soundEnabled = true;
let musicEnabled = true;
let currentSongIndex = 0;
let backgroundMusic;
let songs = [
    'background-music.mp3',
    'SpaceTris_Soundtrack/01 - Main Theme.mp3',
    'SpaceTris_Soundtrack/02 - Battle Theme.mp3',
    'SpaceTris_Soundtrack/03 - Victory Theme.mp3',
    'SpaceTris_Soundtrack/04 - Game Over Theme.mp3'
];

// Sound effects
const sounds = {
    shoot: new Audio('sounds/shoot.mp3'),
    explosion: new Audio('sounds/explosion.mp3'),
    powerup: new Audio('sounds/powerup.mp3'),
    gameOver: new Audio('sounds/gameover.mp3')
};

// Initialize game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Set up player
    player = {
        x: canvas.width / 2,
        y: canvas.height - 50,
        width: 40,
        height: 40,
        speed: 5,
        color: '#00ff00',
        powerUps: {
            shield: false,
            spreadShot: false,
            slowMotion: false,
            missile: false
        }
    };
    
    // Set up event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Load settings
    loadSettings();
    
    // Start game loop
    gameLoop = requestAnimationFrame(update);
    
    // Start background music
    if (musicEnabled) {
        playBackgroundMusic();
    }
}

// Game loop
function update(timestamp) {
    if (!isPaused && !isGameOver) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update game state
        updatePlayer();
        updateBullets();
        updateEnemies();
        updatePowerUps();
        checkCollisions();
        spawnEnemies(timestamp);
        spawnPowerUps(timestamp);
        
        // Draw everything
        drawPlayer();
        drawBullets();
        drawEnemies();
        drawPowerUps();
        drawScore();
        drawLevel();
    }
    
    // Continue game loop
    gameLoop = requestAnimationFrame(update);
}

// Player controls
function handleKeyDown(e) {
    if (isGameOver) return;
    
    switch(e.key) {
        case 'ArrowLeft':
            player.movingLeft = true;
            break;
        case 'ArrowRight':
            player.movingRight = true;
            break;
        case ' ':
            if (!player.shooting) {
                player.shooting = true;
                shoot();
            }
            break;
    }
}

function handleKeyUp(e) {
    switch(e.key) {
        case 'ArrowLeft':
            player.movingLeft = false;
            break;
        case 'ArrowRight':
            player.movingRight = false;
            break;
        case ' ':
            player.shooting = false;
            break;
    }
}

// Update game objects
function updatePlayer() {
    if (player.movingLeft && player.x > 0) {
        player.x -= player.speed;
    }
    if (player.movingRight && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bullets[i].speed;
        if (bullets[i].y < 0) {
            bullets.splice(i, 1);
        }
    }
}

function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].y += enemySpeed;
        if (enemies[i].y > canvas.height) {
            enemies.splice(i, 1);
            gameOver();
        }
    }
}

function updatePowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        powerUps[i].y += 2;
        if (powerUps[i].y > canvas.height) {
            powerUps.splice(i, 1);
        }
    }
}

// Collision detection
function checkCollisions() {
    // Check bullet-enemy collisions
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (isColliding(bullets[i], enemies[j])) {
                bullets.splice(i, 1);
                enemies.splice(j, 1);
                score += 100;
                if (soundEnabled) sounds.explosion.play();
                break;
            }
        }
    }
    
    // Check player-enemy collisions
    if (!player.powerUps.shield) {
        for (let i = enemies.length - 1; i >= 0; i--) {
            if (isColliding(player, enemies[i])) {
                enemies.splice(i, 1);
                gameOver();
                break;
            }
        }
    }
    
    // Check player-powerup collisions
    for (let i = powerUps.length - 1; i >= 0; i--) {
        if (isColliding(player, powerUps[i])) {
            activatePowerUp(powerUps[i].type);
            powerUps.splice(i, 1);
            if (soundEnabled) sounds.powerup.play();
        }
    }
}

function isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Spawning
function spawnEnemies(timestamp) {
    if (timestamp - lastSpawn > spawnRate) {
        const enemy = {
            x: Math.random() * (canvas.width - 40),
            y: -40,
            width: 40,
            height: 40,
            color: '#ff0000',
            shape: getRandomShape()
        };
        enemies.push(enemy);
        lastSpawn = timestamp;
    }
}

function spawnPowerUps(timestamp) {
    if (timestamp - lastPowerUpSpawn > powerUpSpawnRate) {
        const powerUp = {
            x: Math.random() * (canvas.width - 20),
            y: -20,
            width: 20,
            height: 20,
            type: getRandomPowerUpType(),
            color: getPowerUpColor()
        };
        powerUps.push(powerUp);
        lastPowerUpSpawn = timestamp;
    }
}

// Drawing
function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    if (player.powerUps.shield) {
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(player.x - 5, player.y - 5, player.width + 10, player.height + 10);
    }
}

function drawBullets() {
    ctx.fillStyle = '#ffff00';
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });
}

function drawPowerUps() {
    powerUps.forEach(powerUp => {
        ctx.fillStyle = powerUp.color;
        ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
    });
}

function drawScore() {
    ctx.fillStyle = '#ffff00';
    ctx.font = '20px "Press Start 2P"';
    ctx.fillText(`SCORE: ${score}`, 10, 30);
}

function drawLevel() {
    ctx.fillStyle = '#00ffff';
    ctx.font = '20px "Press Start 2P"';
    ctx.fillText(`LEVEL: ${currentLevel}`, canvas.width - 150, 30);
}

// Game actions
function shoot() {
    if (soundEnabled) sounds.shoot.play();
    
    if (player.powerUps.spreadShot) {
        // Shoot three bullets in a spread pattern
        bullets.push(
            createBullet(player.x + player.width / 2, player.y),
            createBullet(player.x + player.width / 2 - 10, player.y),
            createBullet(player.x + player.width / 2 + 10, player.y)
        );
    } else {
        bullets.push(createBullet(player.x + player.width / 2, player.y));
    }
}

function createBullet(x, y) {
    return {
        x: x - 2,
        y: y,
        width: 4,
        height: 10,
        speed: 7
    };
}

function activatePowerUp(type) {
    switch(type) {
        case 'shield':
            player.powerUps.shield = true;
            setTimeout(() => player.powerUps.shield = false, 10000);
            break;
        case 'spreadShot':
            player.powerUps.spreadShot = true;
            setTimeout(() => player.powerUps.spreadShot = false, 15000);
            break;
        case 'slowMotion':
            enemySpeed = 1;
            setTimeout(() => enemySpeed = 2, 8000);
            break;
        case 'missile':
            enemies.forEach(enemy => {
                score += 100;
                if (soundEnabled) sounds.explosion.play();
            });
            enemies = [];
            break;
    }
}

function gameOver() {
    isGameOver = true;
    if (soundEnabled) sounds.gameOver.play();
    cancelAnimationFrame(gameLoop);
    
    const gameOverOverlay = document.getElementById('gameOverOverlay');
    const finalScore = document.getElementById('finalScore');
    finalScore.textContent = `SCORE: ${score}`;
    gameOverOverlay.style.display = 'flex';
}

// Utility functions
function getRandomShape() {
    const shapes = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    return shapes[Math.floor(Math.random() * shapes.length)];
}

function getRandomPowerUpType() {
    const types = ['shield', 'spreadShot', 'slowMotion', 'missile'];
    return types[Math.floor(Math.random() * types.length)];
}

function getPowerUpColor() {
    const colors = {
        shield: '#00ffff',
        spreadShot: '#ff00ff',
        slowMotion: '#ffff00',
        missile: '#ff0000'
    };
    return colors[getRandomPowerUpType()];
}

// Settings management
function loadSettings() {
    const savedName = localStorage.getItem('playerName');
    if (savedName) playerName = savedName;
    
    const savedSound = localStorage.getItem('soundEnabled');
    if (savedSound !== null) soundEnabled = savedSound === 'true';
    
    const savedMusic = localStorage.getItem('musicEnabled');
    if (savedMusic !== null) musicEnabled = savedMusic === 'true';
    
    const savedSongIndex = localStorage.getItem('currentSongIndex');
    if (savedSongIndex !== null) currentSongIndex = parseInt(savedSongIndex);
    
    updateSettingsUI();
}

function saveSettings() {
    localStorage.setItem('playerName', playerName);
    localStorage.setItem('soundEnabled', soundEnabled);
    localStorage.setItem('musicEnabled', musicEnabled);
    localStorage.setItem('currentSongIndex', currentSongIndex);
}

function updateSettingsUI() {
    document.getElementById('playerNameDisplay').textContent = `PLAYER: ${playerName}`;
    document.getElementById('soundToggle').checked = soundEnabled;
    document.getElementById('musicToggle').checked = musicEnabled;
}

// Music controls
function playBackgroundMusic() {
    if (!musicEnabled) return;
    
    if (backgroundMusic) {
        backgroundMusic.pause();
    }
    
    backgroundMusic = new Audio(songs[currentSongIndex]);
    backgroundMusic.loop = true;
    backgroundMusic.play();
}

function nextSong() {
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    playBackgroundMusic();
    saveSettings();
}

function prevSong() {
    currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    playBackgroundMusic();
    saveSettings();
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', init); 