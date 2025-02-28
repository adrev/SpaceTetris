# Space Invaders Game

A browser-based Space Invaders game with Firebase integration for high score tracking.

## Setup Instructions

### Firebase Configuration

This game uses Firebase for storing high scores. To set up your own Firebase project:

1. Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Set up a Realtime Database in your project
3. Copy your Firebase configuration from the Firebase console
4. Open the `config.js` file and replace the placeholder values with your actual Firebase credentials:

```javascript
firebaseConfig.setAttribute('data-api-key', 'YOUR_API_KEY');
firebaseConfig.setAttribute('data-auth-domain', 'YOUR_AUTH_DOMAIN');
firebaseConfig.setAttribute('data-project-id', 'YOUR_PROJECT_ID');
firebaseConfig.setAttribute('data-storage-bucket', 'YOUR_STORAGE_BUCKET');
firebaseConfig.setAttribute('data-messaging-sender-id', 'YOUR_MESSAGING_SENDER_ID');
firebaseConfig.setAttribute('data-app-id', 'YOUR_APP_ID');
firebaseConfig.setAttribute('data-database-url', 'YOUR_DATABASE_URL');
```

### Security Note

The `config.js` file contains sensitive API keys and should NOT be committed to public repositories. It is already added to the `.gitignore` file to prevent accidental commits.

## Database Rules

For your Firebase Realtime Database, set up the following security rules to allow read access to everyone but limit write access to only game score submissions:

```json
{
  "rules": {
    "highscores": {
      ".read": true,
      ".write": true,
      "$scoreId": {
        ".validate": "newData.hasChildren(['name', 'score', 'timestamp'])",
        "name": {
          ".validate": "newData.isString() && newData.val().length <= 30"
        },
        "score": {
          ".validate": "newData.isNumber() && newData.val() >= 0"
        },
        "timestamp": {
          ".validate": "newData.isNumber()"
        }
      }
    }
  }
}
```

## How to Play

1. Open `index.HTML` in your web browser
2. Use arrow keys or on-screen controls to move
3. Press spacebar or the fire button to shoot
4. Collect power-ups for special abilities
5. Submit your high score when the game ends

## Features

- Classic Space Invaders gameplay
- Power-ups: Shield, Spread Shot, and Slow Motion
- Mobile-friendly controls
- High score tracking with Firebase
- Retro sound effects and music 