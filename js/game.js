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
let enemySpeed = GAME_CONFIG.ENEMY_SPEED_INITIAL;
let spawnRate = GAME_CONFIG.ENEMY_SPAWN_RATE;
let lastSpawn = 0;
let lastPowerUpSpawn = 0;
let powerUpSpawnRate = GAME_CONFIG.POWERUP_SPAWN_RATE;
let playerName = 'ANONYMOUS';
let soundEnabled = true;
let musicEnabled = true;
let currentSongIndex = 0;
let backgroundMusic;
let songs = MUSIC_PLAYLIST;

// Visual effects
let particles = [];
let stars = [];

// Sound effects - cached and preloaded
const sounds = {
    shoot: null,
    explosion: null,
    powerup: null,
    gameOver: null
};

// Initialize and preload audio
function initializeAudio() {
    const audioFiles = AUDIO_PATHS;
    
    Object.keys(audioFiles).forEach(key => {
        try {
            sounds[key] = new Audio(audioFiles[key]);
            sounds[key].preload = 'auto';
            sounds[key].volume = GAME_CONFIG.DEFAULT_VOLUME;
        } catch (error) {
            console.warn(`Failed to load sound: ${key}`, error);
            sounds[key] = null;
        }
    });
}

// Safe sound playing function
function playSound(soundName) {
    if (!soundEnabled || !sounds[soundName]) return;
    
    try {
        sounds[soundName].currentTime = 0;
        sounds[soundName].play().catch(error => {
            console.warn(`Failed to play sound: ${soundName}`, error);
        });
    } catch (error) {
        console.warn(`Error playing sound: ${soundName}`, error);
    }
}

// Initialize game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size responsively
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Initialize audio system
    initializeAudio();
    
    // Initialize background effects
    initializeBackground();
    
    // Set up player
    player = {
        x: canvas.width / GAME_CONFIG.PLAYER_START_X_OFFSET,
        y: canvas.height - GAME_CONFIG.PLAYER_START_Y_OFFSET,
        width: GAME_CONFIG.PLAYER_WIDTH,
        height: GAME_CONFIG.PLAYER_HEIGHT,
        speed: GAME_CONFIG.PLAYER_SPEED,
        color: GAME_CONFIG.COLORS.PLAYER,
        movingLeft: false,
        movingRight: false,
        movingUp: false,
        movingDown: false,
        shooting: false,
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
    
    // Focus management to prevent scrolling
    canvas.setAttribute('tabindex', '0'); // Make canvas focusable
    canvas.focus(); // Focus the canvas
    
    // Add focus/blur handlers
    canvas.addEventListener('focus', () => {
        document.body.classList.add('game-focused');
    });
    
    canvas.addEventListener('blur', () => {
        document.body.classList.remove('game-focused');
    });
    
    // Click to focus
    canvas.addEventListener('click', () => {
        canvas.focus();
    });
    
    // Set up UI event listeners
    setupUIEventListeners();
    
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
        
        // Draw animated background elements
        drawBackground(timestamp);
        
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
        drawParticles(timestamp);
        updateHUD();
    }
    
    // Continue game loop
    gameLoop = requestAnimationFrame(update);
}

// Player controls
function handleKeyDown(e) {
    if (isGameOver) return;
    
    switch(e.key) {
        case 'ArrowLeft':
            e.preventDefault(); // Prevent default arrow key behavior
            player.movingLeft = true;
            break;
        case 'ArrowRight':
            e.preventDefault(); // Prevent default arrow key behavior
            player.movingRight = true;
            break;
        case 'ArrowUp':
            e.preventDefault(); // Prevent arrow keys from scrolling
            player.movingUp = true;
            break;
        case 'ArrowDown':
            e.preventDefault(); // Prevent arrow keys from scrolling
            player.movingDown = true;
            break;
        case ' ':
            e.preventDefault(); // Prevent spacebar from scrolling page
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
            e.preventDefault();
            player.movingLeft = false;
            break;
        case 'ArrowRight':
            e.preventDefault();
            player.movingRight = false;
            break;
        case 'ArrowUp':
            e.preventDefault();
            player.movingUp = false;
            break;
        case 'ArrowDown':
            e.preventDefault();
            player.movingDown = false;
            break;
        case ' ':
            e.preventDefault();
            player.shooting = false;
            break;
    }
}

// Update game objects
function updatePlayer() {
    // Horizontal movement
    if (player.movingLeft && player.x > 0) {
        player.x -= player.speed;
    }
    if (player.movingRight && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
    
    // Vertical movement (with boundaries)
    if (player.movingUp && player.y > canvas.height * 0.3) { // Don't go too high
        player.y -= player.speed;
    }
    if (player.movingDown && player.y < canvas.height - player.height - 10) { // Stay above bottom
        player.y += player.speed;
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
                // Create explosion particle effect
                createParticle(enemies[j].x + enemies[j].width/2, enemies[j].y + enemies[j].height/2, 'explosion');
                
                bullets.splice(i, 1);
                enemies.splice(j, 1);
                score += GAME_CONFIG.ENEMY_KILL_SCORE;
                playSound('explosion');
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
            // Create power-up collection effect
            createParticle(powerUps[i].x + powerUps[i].width/2, powerUps[i].y + powerUps[i].height/2, 'powerup');
            
            activatePowerUp(powerUps[i].type);
            powerUps.splice(i, 1);
            playSound('powerup');
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
        const shape = getRandomShape();
        const enemy = {
            x: Math.random() * (canvas.width - 60),
            y: -60,
            width: 60,
            height: 60,
            color: getTetrisColor(shape),
            shape: shape
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
    const x = player.x;
    const y = player.y;
    const w = player.width;
    const h = player.height;
    
    // Draw spaceship with detailed design
    ctx.save();
    
    // Main body (dark blue-gray)
    ctx.fillStyle = '#2a4d6b';
    ctx.fillRect(x + w/4, y + h/3, w/2, h*2/3);
    
    // Cockpit (bright cyan)
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(x + w/3, y + h/4, w/3, h/3);
    
    // Wings (lighter blue)
    ctx.fillStyle = '#4a7c95';
    ctx.fillRect(x, y + h/2, w/4, h/4);
    ctx.fillRect(x + 3*w/4, y + h/2, w/4, h/4);
    
    // Dynamic engine effects based on movement
    let engineIntensity = 1;
    if (player.movingUp) engineIntensity = 1.5;
    if (player.movingDown) engineIntensity = 0.7;
    
    // Main engine glow (bright yellow-orange)
    ctx.fillStyle = '#ffaa00';
    const engineHeight = Math.floor(4 * engineIntensity);
    ctx.fillRect(x + w/4 + 2, y + h - engineHeight, w/2 - 4, engineHeight);
    
    // Engine core (bright red)
    ctx.fillStyle = '#ff4400';
    const coreHeight = Math.floor(2 * engineIntensity);
    ctx.fillRect(x + w/4 + 6, y + h - coreHeight, w/2 - 12, coreHeight);
    
    // Maneuvering thrusters when moving vertically
    if (player.movingUp) {
        // Forward thrusters (bottom of ship)
        ctx.fillStyle = '#00aaff';
        ctx.fillRect(x + w/4, y + h + 2, w/2, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + w/4 + 4, y + h + 3, w/2 - 8, 1);
    }
    
    if (player.movingDown) {
        // Reverse thrusters (top of ship)
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(x + w/4, y - 3, w/2, 2);
    }
    
    // Weapon systems (green dots)
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(x + w/4 - 2, y + h/3, 2, 2);
    ctx.fillRect(x + 3*w/4, y + h/3, 2, 2);
    
    ctx.restore();
    
    // Shield effect
    if (player.powerUps.shield) {
        ctx.save();
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.7;
        ctx.setLineDash([5, 5]);
        const time = Date.now() * 0.01;
        ctx.lineDashOffset = time;
        ctx.strokeRect(x - 8, y - 8, w + 16, h + 16);
        
        // Inner shield glow
        ctx.strokeStyle = '#88ffff';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5;
        ctx.strokeRect(x - 5, y - 5, w + 10, h + 10);
        ctx.restore();
    }
}

function drawBullets() {
    bullets.forEach(bullet => {
        const x = bullet.x;
        const y = bullet.y;
        const w = bullet.width;
        const h = bullet.height;
        
        // Main bullet body (bright yellow)
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(x, y, w, h);
        
        // Bullet core (white hot center)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 1, y + 1, w - 2, h - 3);
        
        // Energy trail effect
        ctx.fillStyle = '#ffaa00';
        ctx.globalAlpha = 0.6;
        ctx.fillRect(x - 1, y + h, w + 2, 3);
        ctx.globalAlpha = 1;
    });
}

function drawEnemies() {
    enemies.forEach(enemy => {
        const x = enemy.x;
        const y = enemy.y;
        const w = enemy.width;
        const h = enemy.height;
        
        ctx.save();
        
        // Get ship colors based on Tetris piece
        const colors = {
            'I': { main: '#1a4d5d', accent: '#00ffff', glow: '#88ffff' }, // Cyan theme
            'O': { main: '#5d5d1a', accent: '#ffff00', glow: '#ffff88' }, // Yellow theme
            'T': { main: '#4d1a5d', accent: '#aa44aa', glow: '#cc88cc' }, // Purple theme
            'S': { main: '#1a5d1a', accent: '#00ff00', glow: '#88ff88' }, // Green theme
            'Z': { main: '#5d1a1a', accent: '#ff4444', glow: '#ff8888' }, // Red theme
            'J': { main: '#1a1a5d', accent: '#4444ff', glow: '#8888ff' }, // Blue theme
            'L': { main: '#5d3d1a', accent: '#ff7f00', glow: '#ffaa88' }  // Orange theme
        };
        
        const color = colors[enemy.shape] || colors['I'];
        
        // Draw spaceship inspired by Tetris shape
        switch(enemy.shape) {
            case 'I': // Long, sleek interceptor (inspired by I-piece)
                // Main fuselage
                ctx.fillStyle = color.main;
                ctx.fillRect(x + w/3, y, w/3, h);
                
                // Cockpit
                ctx.fillStyle = color.accent;
                ctx.fillRect(x + w/3 + 2, y, w/3 - 4, h/3);
                
                // Side fins
                ctx.fillStyle = color.main;
                ctx.fillRect(x + w/6, y + h/4, w/6, h/2);
                ctx.fillRect(x + 2*w/3, y + h/4, w/6, h/2);
                
                // Engine
                ctx.fillStyle = '#ff6600';
                ctx.fillRect(x + w/3 + 4, y + h - 3, w/3 - 8, 3);
                break;
                
            case 'O': // Boxy heavy cruiser (inspired by O-piece)
                // Main body
                ctx.fillStyle = color.main;
                ctx.fillRect(x + w/6, y + h/6, 2*w/3, 2*h/3);
                
                // Armor plating
                ctx.fillStyle = color.accent;
                ctx.fillRect(x + w/4, y + h/4, w/2, h/2);
                
                // Corner engines
                ctx.fillStyle = '#ff6600';
                ctx.fillRect(x + w/4, y + h - 3, w/8, 3);
                ctx.fillRect(x + 5*w/8, y + h - 3, w/8, 3);
                
                // Cockpit
                ctx.fillStyle = color.glow;
                ctx.fillRect(x + w/3, y + h/6, w/3, h/6);
                break;
                
            case 'T': // T-shaped fighter with central body and wings
                // Central fuselage
                ctx.fillStyle = color.main;
                ctx.fillRect(x + w/3, y + h/3, w/3, 2*h/3);
                
                // Wings (top part of T)
                ctx.fillStyle = color.main;
                ctx.fillRect(x, y + h/6, w, h/4);
                
                // Cockpit
                ctx.fillStyle = color.accent;
                ctx.fillRect(x + w/3 + 2, y + h/3, w/3 - 4, h/4);
                
                // Wing weapons
                ctx.fillStyle = color.accent;
                ctx.fillRect(x + w/8, y + h/6 + 2, w/8, h/8);
                ctx.fillStyle = color.accent;
                ctx.fillRect(x + 3*w/4, y + h/6 + 2, w/8, h/8);
                
                // Engine
                ctx.fillStyle = '#ff6600';
                ctx.fillRect(x + w/3 + 4, y + h - 3, w/3 - 8, 3);
                break;
                
            case 'S': // S-curved stealth fighter
                // Upper section
                ctx.fillStyle = color.main;
                ctx.fillRect(x + w/3, y, w/2, h/2);
                
                // Lower section (offset)
                ctx.fillStyle = color.main;
                ctx.fillRect(x, y + h/2, w/2, h/2);
                
                // Connecting bridge
                ctx.fillStyle = color.main;
                ctx.fillRect(x + w/6, y + h/3, w/3, h/3);
                
                // Cockpits
                ctx.fillStyle = color.accent;
                ctx.fillRect(x + w/3 + 2, y + 2, w/2 - 4, h/6);
                ctx.fillStyle = color.accent;
                ctx.fillRect(x + 2, y + h/2 + 2, w/2 - 4, h/6);
                
                // Engines
                ctx.fillStyle = '#ff6600';
                ctx.fillRect(x + w/3 + 4, y + h/2 - 3, w/6, 3);
                ctx.fillStyle = '#ff6600';
                ctx.fillRect(x + 4, y + h - 3, w/6, 3);
                break;
                
            case 'Z': // Z-shaped assault fighter
                // Upper section
                ctx.fillStyle = color.main;
                ctx.fillRect(x, y, w/2, h/2);
                
                // Lower section (offset)
                ctx.fillStyle = color.main;
                ctx.fillRect(x + w/3, y + h/2, w/2, h/2);
                
                // Connecting bridge
                ctx.fillStyle = color.main;
                ctx.fillRect(x + w/6, y + h/3, w/3, h/3);
                
                // Cockpits
                ctx.fillStyle = color.accent;
                ctx.fillRect(x + 2, y + 2, w/2 - 4, h/6);
                ctx.fillStyle = color.accent;
                ctx.fillRect(x + w/3 + 2, y + h/2 + 2, w/2 - 4, h/6);
                
                // Engines
                ctx.fillStyle = '#ff6600';
                ctx.fillRect(x + 4, y + h/2 - 3, w/6, 3);
                ctx.fillStyle = '#ff6600';
                ctx.fillRect(x + w/3 + 4, y + h - 3, w/6, 3);
                break;
                
            case 'J': // J-shaped destroyer
                // Main vertical body
                ctx.fillStyle = color.main;
                ctx.fillRect(x, y, w/3, h);
                
                // Bottom extension
                ctx.fillStyle = color.main;
                ctx.fillRect(x, y + 2*h/3, 2*w/3, h/3);
                
                // Command tower
                ctx.fillStyle = color.accent;
                ctx.fillRect(x + 2, y, w/3 - 4, h/3);
                
                // Bridge
                ctx.fillStyle = color.accent;
                ctx.fillRect(x + 2, y + 2*h/3 + 2, 2*w/3 - 4, h/3 - 4);
                
                // Engines
                ctx.fillStyle = '#ff6600';
                ctx.fillRect(x + 2, y + h - 3, w/6, 3);
                ctx.fillStyle = '#ff6600';
                ctx.fillRect(x + w/3, y + h - 3, w/6, 3);
                break;
                
            case 'L': // L-shaped battlecruiser
                // Main vertical body
                ctx.fillStyle = color.main;
                ctx.fillRect(x + w/3, y, w/3, h);
                
                // Bottom extension
                ctx.fillStyle = color.main;
                ctx.fillRect(x, y + 2*h/3, 2*w/3, h/3);
                
                // Command tower
                ctx.fillStyle = color.accent;
                ctx.fillRect(x + w/3 + 2, y, w/3 - 4, h/3);
                
                // Bridge
                ctx.fillStyle = color.accent;
                ctx.fillRect(x + 2, y + 2*h/3 + 2, 2*w/3 - 4, h/3 - 4);
                
                // Engines
                ctx.fillStyle = '#ff6600';
                ctx.fillRect(x + w/3, y + h - 3, w/6, 3);
                ctx.fillStyle = '#ff6600';
                ctx.fillRect(x + w/2, y + h - 3, w/6, 3);
                break;
        }
        
        // Add weapon systems
        ctx.fillStyle = color.accent;
        ctx.fillRect(x + w/4, y + h/2, 2, 2);
        ctx.fillRect(x + 3*w/4 - 2, y + h/2, 2, 2);
        
        // Engine glow
        ctx.fillStyle = '#ff8800';
        ctx.globalAlpha = 0.8;
        ctx.fillRect(x + w/4, y - 2, w/2, 2);
        ctx.globalAlpha = 1;
        
        ctx.restore();
    });
}

function drawPowerUps() {
    powerUps.forEach(powerUp => {
        const x = powerUp.x;
        const y = powerUp.y;
        const w = powerUp.width;
        const h = powerUp.height;
        const time = Date.now() * 0.005;
        
        ctx.save();
        
        // Rotating glow effect
        ctx.translate(x + w/2, y + h/2);
        ctx.rotate(time);
        
        // Draw power-up based on type
        if (powerUp.type === 'shield') {
            // Shield power-up (cyan)
            ctx.fillStyle = '#004444';
            ctx.fillRect(-w/2, -h/2, w, h);
            ctx.fillStyle = '#00aaaa';
            ctx.fillRect(-w/2 + 2, -h/2 + 2, w - 4, h - 4);
            ctx.fillStyle = '#00ffff';
            ctx.fillRect(-w/2 + 4, -h/2 + 4, w - 8, h - 8);
            // Shield icon
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-2, -6, 4, 4);
            ctx.fillRect(-4, -4, 8, 2);
        } else if (powerUp.type === 'spreadShot') {
            // Spread shot power-up (magenta)
            ctx.fillStyle = '#440044';
            ctx.fillRect(-w/2, -h/2, w, h);
            ctx.fillStyle = '#aa00aa';
            ctx.fillRect(-w/2 + 2, -h/2 + 2, w - 4, h - 4);
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(-w/2 + 4, -h/2 + 4, w - 8, h - 8);
            // Triple shot icon
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-1, -6, 2, 8);
            ctx.fillRect(-4, -4, 2, 6);
            ctx.fillRect(2, -4, 2, 6);
        } else if (powerUp.type === 'slowMotion') {
            // Slow motion power-up (yellow)
            ctx.fillStyle = '#444400';
            ctx.fillRect(-w/2, -h/2, w, h);
            ctx.fillStyle = '#aaaa00';
            ctx.fillRect(-w/2 + 2, -h/2 + 2, w - 4, h - 4);
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(-w/2 + 4, -h/2 + 4, w - 8, h - 8);
            // Clock icon
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-3, -3, 6, 6);
            ctx.fillStyle = '#444400';
            ctx.fillRect(-1, -1, 2, 2);
        } else {
            // Missile power-up (red)
            ctx.fillStyle = '#440000';
            ctx.fillRect(-w/2, -h/2, w, h);
            ctx.fillStyle = '#aa0000';
            ctx.fillRect(-w/2 + 2, -h/2 + 2, w - 4, h - 4);
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(-w/2 + 4, -h/2 + 4, w - 8, h - 8);
            // Explosion icon
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-1, -6, 2, 12);
            ctx.fillRect(-6, -1, 12, 2);
            ctx.fillRect(-4, -4, 2, 2);
            ctx.fillRect(2, -4, 2, 2);
            ctx.fillRect(-4, 2, 2, 2);
            ctx.fillRect(2, 2, 2, 2);
        }
        
        ctx.restore();
        
        // Outer glow effect
        ctx.save();
        ctx.globalAlpha = 0.3 + 0.3 * Math.sin(time * 3);
        ctx.fillStyle = powerUp.color;
        ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
        ctx.restore();
    });
}

function updateHUD() {
    // Update HTML HUD elements instead of drawing on canvas
    document.getElementById('hudScore').textContent = `SCORE: ${score}`;
    document.getElementById('hudLevel').textContent = `LEVEL: ${currentLevel}`;
}

// Level drawing moved to updateHUD function

// Game actions
function shoot() {
    playSound('shoot');
    
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
        x: x - GAME_CONFIG.BULLET_OFFSET,
        y: y,
        width: GAME_CONFIG.BULLET_WIDTH,
        height: GAME_CONFIG.BULLET_HEIGHT,
        speed: GAME_CONFIG.BULLET_SPEED
    };
}

function activatePowerUp(type) {
    switch(type) {
        case 'shield':
            player.powerUps.shield = true;
            setTimeout(() => player.powerUps.shield = false, GAME_CONFIG.SHIELD_DURATION);
            break;
        case 'spreadShot':
            player.powerUps.spreadShot = true;
            setTimeout(() => player.powerUps.spreadShot = false, GAME_CONFIG.SPREAD_SHOT_DURATION);
            break;
        case 'slowMotion':
            enemySpeed = GAME_CONFIG.ENEMY_SLOW_SPEED;
            setTimeout(() => enemySpeed = GAME_CONFIG.ENEMY_SPEED_INITIAL, GAME_CONFIG.SLOW_MOTION_DURATION);
            break;
        case 'missile':
            enemies.forEach(enemy => {
                score += GAME_CONFIG.ENEMY_KILL_SCORE;
                playSound('explosion');
            });
            enemies = [];
            break;
    }
}

function gameOver() {
    isGameOver = true;
    playSound('gameOver');
    cancelAnimationFrame(gameLoop);
    
    const gameOverOverlay = document.getElementById('gameOverOverlay');
    const finalScore = document.getElementById('finalScore');
    finalScore.textContent = `SCORE: ${score}`;
    gameOverOverlay.style.display = 'flex';
}

// Utility functions
function getRandomShape() {
    return TETRIS_SHAPES[Math.floor(Math.random() * TETRIS_SHAPES.length)];
}

function getTetrisColor(shape) {
    const colors = {
        'I': '#00ffff', // Cyan
        'O': '#ffff00', // Yellow
        'T': '#800080', // Purple
        'S': '#00ff00', // Green
        'Z': '#ff0000', // Red
        'J': '#0000ff', // Blue
        'L': '#ff7f00'  // Orange
    };
    return colors[shape] || '#00ffff';
}

function getRandomPowerUpType() {
    return POWER_UP_TYPES[Math.floor(Math.random() * POWER_UP_TYPES.length)];
}

function getPowerUpColor() {
    return GAME_CONFIG.COLORS.POWER_UPS[getRandomPowerUpType()];
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

// Canvas resize function
function resizeCanvas() {
    const container = document.getElementById('gameContainer');
    const containerRect = container.getBoundingClientRect();
    
    // Maintain 3:4 aspect ratio
    const maxWidth = Math.min(containerRect.width, 600);
    const maxHeight = Math.min(containerRect.height, 800);
    
    if (maxWidth / maxHeight > 3/4) {
        canvas.width = maxHeight * 3/4;
        canvas.height = maxHeight;
    } else {
        canvas.width = maxWidth;
        canvas.height = maxWidth * 4/3;
    }
    
    // Update canvas display size
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';
    
    // Reset player position if needed
    if (player) {
        player.x = Math.min(player.x, canvas.width - player.width);
        player.y = canvas.height - GAME_CONFIG.PLAYER_START_Y_OFFSET;
    }
}

// Reset game function
function resetGame() {
    // Reset all game state
    bullets = [];
    enemies = [];
    powerUps = [];
    particles = [];
    score = 0;
    isGameOver = false;
    isPaused = false;
    currentLevel = 1;
    enemySpeed = GAME_CONFIG.ENEMY_SPEED_INITIAL;
    lastSpawn = 0;
    lastPowerUpSpawn = 0;
    
    // Reinitialize background
    initializeBackground();
    
    // Reset player
    if (player) {
        player.x = canvas.width / GAME_CONFIG.PLAYER_START_X_OFFSET;
        player.y = canvas.height - GAME_CONFIG.PLAYER_START_Y_OFFSET;
        player.movingLeft = false;
        player.movingRight = false;
        player.movingUp = false;
        player.movingDown = false;
        player.shooting = false;
        player.powerUps = {
            shield: false,
            spreadShot: false,
            slowMotion: false,
            missile: false
        };
    }
    
    // Hide game over overlay
    document.getElementById('gameOverOverlay').style.display = 'none';
    
    // Restart game loop
    gameLoop = requestAnimationFrame(update);
}

// Set up UI event listeners
function setupUIEventListeners() {
    // Submit score button
    document.getElementById('submitScoreBtn').addEventListener('click', function() {
        const nameInput = document.getElementById('nicknameInput');
        const name = nameInput.value.trim() || 'Anonymous';
        
        if (typeof submitScore === 'function') {
            submitScore(name, score).then(() => {
                alert('Score submitted successfully!');
            }).catch((error) => {
                alert('Failed to submit score: ' + error.message);
            });
        } else {
            alert('Firebase not configured. Score cannot be submitted.');
        }
    });
    
    // Settings button
    document.getElementById('settingsBtn').addEventListener('click', function() {
        document.getElementById('settingsOverlay').style.display = 'flex';
    });
    
    // Close settings button
    document.getElementById('closeSettings').addEventListener('click', function() {
        document.getElementById('settingsOverlay').style.display = 'none';
    });
    
    // Sound toggle
    document.getElementById('soundToggle').addEventListener('change', function() {
        soundEnabled = this.checked;
        saveSettings();
    });
    
    // Music toggle
    document.getElementById('musicToggle').addEventListener('change', function() {
        musicEnabled = this.checked;
        if (musicEnabled) {
            playBackgroundMusic();
        } else if (backgroundMusic) {
            backgroundMusic.pause();
        }
        saveSettings();
    });
    
    // Music controls
    document.getElementById('nextSong').addEventListener('click', nextSong);
    document.getElementById('prevSong').addEventListener('click', prevSong);
}

// Background and particle effects
function initializeBackground() {
    // Create starfield
    stars = [];
    for (let i = 0; i < 50; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 2 + 0.5,
            opacity: Math.random() * 0.8 + 0.2,
            twinkle: Math.random() * 6.28
        });
    }
}

function drawBackground(timestamp) {
    // Update and draw moving stars
    ctx.save();
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = -5;
            star.x = Math.random() * canvas.width;
        }
        
        const twinkleAlpha = star.opacity * (0.5 + 0.5 * Math.sin(timestamp * 0.01 + star.twinkle));
        ctx.globalAlpha = twinkleAlpha;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });
    ctx.restore();
}

function createParticle(x, y, type = 'explosion') {
    const colors = {
        explosion: ['#ff4400', '#ff6600', '#ff8800', '#ffaa00'],
        hit: ['#ff0000', '#ff3333', '#ff6666', '#ffffff'],
        powerup: ['#00ffff', '#00aaff', '#0088ff', '#ffffff']
    };
    
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 30,
            maxLife: 30,
            color: colors[type][Math.floor(Math.random() * colors[type].length)],
            size: Math.random() * 3 + 1
        });
    }
}

function drawParticles(timestamp) {
    ctx.save();
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.95;
        particle.vy *= 0.95;
        particle.life--;
        
        if (particle.life <= 0) {
            particles.splice(i, 1);
            continue;
        }
        
        const alpha = particle.life / particle.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    }
    ctx.restore();
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', init); 