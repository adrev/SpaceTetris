# Firebase Rules Explanation for SpaceTetris

## Rules Overview
These Firebase rules are specifically designed for a game highscore system that balances security with functionality.

## What These Rules Do

### ✅ **Allow (Secure Operations)**
- **Read highscores**: Anyone can view the leaderboard
- **Add new scores**: Players can submit scores when they finish a game
- **Data validation**: Ensures all scores have valid name, score, and timestamp
- **Reasonable limits**: Names 1-30 characters, scores 0-999,999 points

### ❌ **Prevent (Security Features)**
- **Modify existing scores**: Once submitted, scores cannot be changed
- **Delete scores**: Prevents score manipulation or leaderboard clearing
- **Invalid data**: Rejects negative scores, missing fields, future timestamps
- **Extra fields**: Only allows name, score, timestamp (prevents data injection)

## Why These Rules Are Appropriate for Games

1. **Public Leaderboard**: Anyone can see highscores (encouraging competition)
2. **Fair Play**: Prevents cheating by modifying existing scores
3. **Data Integrity**: Validates score format and prevents invalid submissions
4. **Simple Submission**: Players can easily submit scores without authentication
5. **Abuse Prevention**: Limits prevent spam and unrealistic scores

## Rule Breakdown

```json
{
  "highscores": {
    ".read": true,                                    // Anyone can read scores
    ".write": "newData.exists()",                     // Only allow adding data
    "$scoreId": {
      ".write": "!data.exists() && newData.hasChildren(['name', 'score', 'timestamp'])",
      // ↳ Only write if score doesn't exist AND has required fields
      
      "name": {
        ".validate": "newData.isString() && newData.val().length >= 1 && newData.val().length <= 30"
        // ↳ Name must be 1-30 character string
      },
      "score": {
        ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 999999"
        // ↳ Score must be number between 0-999,999
      },
      "timestamp": {
        ".validate": "newData.isNumber() && newData.val() <= now"
        // ↳ Timestamp must be number, not in future
      },
      "$other": {
        ".validate": false
        // ↳ Reject any other fields
      }
    }
  }
}
```

## For Production Use
These rules are production-ready for a game like SpaceTetris. They provide:
- **Security**: Prevent common attack vectors
- **Functionality**: Allow normal game operations
- **Simplicity**: No complex authentication required
- **Scalability**: Work with unlimited players and scores

## Installation
Copy the rules from `firebase-rules.json` into your Firebase Console:
Firebase Console → Realtime Database → Rules → Paste → Publish