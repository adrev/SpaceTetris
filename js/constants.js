// Game Constants
const GAME_CONFIG = {
    // Canvas dimensions
    CANVAS_WIDTH: 600,
    CANVAS_HEIGHT: 800,
    
    // Player settings
    PLAYER_WIDTH: 40,
    PLAYER_HEIGHT: 40,
    PLAYER_SPEED: 5,
    PLAYER_START_X_OFFSET: 2, // canvas.width / 2
    PLAYER_START_Y_OFFSET: 50, // canvas.height - 50
    
    // Bullet settings
    BULLET_WIDTH: 4,
    BULLET_HEIGHT: 10,
    BULLET_SPEED: 7,
    BULLET_OFFSET: 2, // x offset from center
    
    // Enemy settings
    ENEMY_WIDTH: 40,
    ENEMY_HEIGHT: 40,
    ENEMY_SPEED_INITIAL: 2,
    ENEMY_SPAWN_RATE: 2000, // milliseconds
    ENEMY_SLOW_SPEED: 1,
    
    // Power-up settings
    POWERUP_WIDTH: 20,
    POWERUP_HEIGHT: 20,
    POWERUP_SPEED: 2,
    POWERUP_SPAWN_RATE: 10000, // milliseconds
    
    // Scoring
    ENEMY_KILL_SCORE: 100,
    
    // Power-up durations (milliseconds)
    SHIELD_DURATION: 10000,
    SPREAD_SHOT_DURATION: 15000,
    SLOW_MOTION_DURATION: 8000,
    
    // Audio settings
    DEFAULT_VOLUME: 0.5,
    
    // UI settings
    FONT_SIZE: 20,
    FONT_FAMILY: 'Press Start 2P',
    
    // Colors
    COLORS: {
        PLAYER: '#00ff00',
        BULLET: '#ffff00',
        ENEMY: '#ff0000',
        SHIELD: '#00ffff',
        SCORE_TEXT: '#ffff00',
        LEVEL_TEXT: '#00ffff',
        POWER_UPS: {
            shield: '#00ffff',
            spreadShot: '#ff00ff',
            slowMotion: '#ffff00',
            missile: '#ff0000'
        }
    },
    
    // Game mechanics
    SPREAD_SHOT_SPREAD: 10, // pixel offset for spread shots
    SHIELD_BORDER_OFFSET: 5 // pixels around player for shield visual
};

// Tetris shapes (for enemy variety)
const TETRIS_SHAPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

// Power-up types
const POWER_UP_TYPES = ['shield', 'spreadShot', 'slowMotion', 'missile'];

// Audio file paths
const AUDIO_PATHS = {
    shoot: 'sounds/laser.mp3',
    explosion: 'sounds/explosion.mp3',
    powerup: 'sounds/powerup.mp3',
    gameOver: 'sounds/gameover.mp3'
};

// Music playlist
const MUSIC_PLAYLIST = [
    'background-music.mp3',
    'SpaceTris_Soundtrack/01 - Main Theme.mp3',
    'SpaceTris_Soundtrack/02 - Battle Theme.mp3',
    'SpaceTris_Soundtrack/03 - Victory Theme.mp3',
    'SpaceTris_Soundtrack/04 - Game Over Theme.mp3'
];