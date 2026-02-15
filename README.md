# Travel English Learning App

A secure, offline-capable web application for learning travel English through TTS (Text-to-Speech) and typing dictation practice.

## 🌐 GitHub Pages Deployment

This app is configured for GitHub Pages deployment with search engine blocking.

**Privacy**: This site uses `robots.txt` to prevent search engine indexing. Only people with the direct URL can access it.

## 🚀 Quick Start

### Local Development

1. **Clone/download this repository**

2. **Start a local web server** (required for file fetching):

   ```bash
   # Option 1: Python 3
   python3 -m http.server 8000
   
   # Option 2: Python 2
   python -m SimpleHTTPServer 8000
   
   # Option 3: Node.js (with http-server)
   npx http-server -p 8000
   
   # Option 4: PHP
   php -S localhost:8000
   ```

3. **Open in browser**: http://localhost:8000

### Static Hosting

Deploy to any static hosting service:
- GitHub Pages
- Netlify
- Vercel
- AWS S3 + CloudFront
- Firebase Hosting

Simply upload all files maintaining the folder structure.

---

## 📁 File Structure

```
/
├── index.html              # Main HTML file
├── style.css               # Styling
├── app.js                  # Application logic
├── README.md               # This file
└── packs/                  # Content packs
    ├── index.json          # Pack list
    └── airport_security/
        └── script.json     # Conversation script
```

---

## ✨ Features

### TTS (Text-to-Speech)
- Play individual lines or continuous playback
- Adjustable speech rate (0.6x - 1.2x)
- Configurable gap between lines (0-2000ms)
- English voice selection
- Visual highlighting of current line

### Dictation (Typing Practice)
- Type what you hear
- Automatic scoring (word accuracy)
- Visual diff display (correct/incorrect/missing words)
- Review queue for lines with <90% accuracy
- Progress tracking per line

### Progress Management
- Automatic saving to LocalStorage
- Best score tracking
- Attempt counter
- Review-only mode to focus on difficult lines
- Overall pack completion percentage

---

## 🎯 Usage

### Learning a Pack

1. **Select a pack** from the home screen
2. **Click a line** in the left panel to select it
3. **Press Play** to hear the line spoken
4. **Type the dictation** in the textarea
5. **Press Check** to see your score and diff
6. Lines with <90% score are added to review queue

### Review Mode

1. Toggle **"Review Only"** checkbox
2. Only lines in your review queue will be shown
3. Practice until you achieve 90%+ accuracy
4. Lines are automatically removed from review queue when mastered

### Settings

- Speech rate, gap, and voice are auto-saved
- Use **Reset All Data** to clear all progress and settings
- Settings persist across browser sessions

---

## 📦 Adding New Packs

### Step 1: Create pack folder

```bash
mkdir -p packs/your_pack_id
```

### Step 2: Create script.json

```json
[
  {
    "role": "Speaker Name",
    "text": "What they say"
  },
  {
    "role": "You",
    "text": "Your response"
  }
]
```

**Limits:**
- Maximum 1000 lines per pack
- Maximum 300 characters per line
- Maximum 200KB total file size

### Step 3: Add to packs/index.json

```json
[
  {
    "id": "your_pack_id",
    "title": "Display Title",
    "category": "Category Name",
    "level": "A1-B2",
    "language": "en",
    "scriptFile": "packs/your_pack_id/script.json"
  }
]
```

### Step 4: Refresh the app

No code changes needed! The new pack will appear automatically.

---

## 🔒 Security Features

### XSS Prevention
- **Zero innerHTML usage** throughout the entire codebase
- All DOM manipulation via `textContent` or `createElement`
- Diff highlighting uses safe DOM node creation

### Path Traversal Protection
- Script paths validated to prevent `../` attacks
- All pack files must be under `packs/` directory
- Absolute paths are rejected

### Input Validation
- JSON structure validation
- Type checking (arrays, strings, objects)
- Size limits enforced (200KB per pack)
- Line length limits (300 chars)
- Line count limits (1000 lines)

### Content Security Policy
- Inline scripts blocked
- External resources restricted
- Meta tag CSP in HTML
- Recommended: Add HTTP headers for production

### Storage Safety
- No personal information stored
- Only progress stats and settings
- 5MB LocalStorage limit enforced
- Data serialization size checked before saving

---

## 🌐 Browser Compatibility

### Fully Supported
- **Chrome/Edge**: 89+
- **Firefox**: 87+
- **Safari**: 14.1+
- **Mobile Safari**: iOS 14.5+
- **Chrome Android**: 89+

### Requirements
- Web Speech API (speechSynthesis)
- LocalStorage
- ES6 JavaScript
- Fetch API

### Known Limitations
- **Safari**: May have limited voice selection
- **iOS**: Speech rate adjustment may not work perfectly
- **Firefox**: Voice loading may be delayed (use voiceschanged event)
- **Offline**: Requires local server or static hosting

---

## 🐛 Known Issues & Limitations

### 1. Voice Loading
**Issue**: Voices may not load immediately on page load  
**Workaround**: The app listens for `voiceschanged` event. If no voices appear, refresh the page.

### 2. Speech Synthesis Pause/Resume
**Issue**: Browser support for pause/resume is inconsistent  
**Implementation**: Currently uses cancel + replay approach

### 3. Mobile Speech Rate
**Issue**: iOS Safari may ignore rate adjustments below 0.8x or above 1.0x  
**Status**: This is a browser limitation

### 4. Diff Algorithm
**Issue**: Simple word-by-word comparison, not optimal for complex edits  
**Status**: MVP implementation, sufficient for learning purposes

### 5. Review Queue
**Issue**: No manual removal from review queue  
**Workaround**: Achieve 90%+ score to auto-remove, or use data reset

### 6. No Undo
**Issue**: Data reset is permanent  
**Mitigation**: Confirmation dialog before deletion

---

## 🔧 Troubleshooting

### Packs don't load
- Check browser console for errors
- Ensure you're using a local server (not `file://`)
- Validate JSON syntax in pack files
- Check file paths in `index.json`

### No voices available
- Wait 2-3 seconds for voices to load
- Refresh the page
- Check browser compatibility
- Ensure system has English TTS voices installed

### Speech doesn't play
- Check browser console for errors
- Ensure page has user interaction (click something first)
- Try a different voice from the dropdown
- Check browser's audio permissions

### Progress not saving
- Check browser's LocalStorage quota
- Ensure cookies/storage are not disabled
- Check if in private/incognito mode (may clear on close)
- Verify total storage size <5MB

### Dictation diff looks wrong
- This is a simple algorithm - it's not perfect
- Focus on the score percentage
- Use as a learning aid, not absolute truth

---

## 🚨 Security Notes

### For Developers

1. **Never use innerHTML**: Always use `textContent` or DOM methods
2. **Validate all inputs**: Check types, lengths, and structure
3. **Path validation**: Always call `validateScriptPath()` for external paths
4. **Size limits**: Enforce before parsing or storing
5. **CSP headers**: Add to production hosting configuration

### For Users

- Only add trusted pack files
- Be cautious with packs from unknown sources
- Review pack content before use
- Use the data reset feature if needed

---

## 📄 License

This project is provided as-is for educational purposes.

---

## 🙏 Credits

- Uses Web Speech API (browser built-in TTS)
- No external dependencies
- Pure vanilla JavaScript

---

## 📞 Support

For issues or questions:
1. Check this README
2. Review browser console errors
3. Verify pack JSON structure
4. Test in a different browser

---

**Enjoy learning English! 🌍✈️**
