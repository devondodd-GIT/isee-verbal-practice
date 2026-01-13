# ISEE Verbal Practice App

A web-based study tool for ISEE Verbal Reasoning test preparation, featuring online practice quizzes, flashcards, and printable worksheets.

## Features

- **Online Practice** — Interactive quizzes with instant feedback, timer options, and progress tracking
- **Flashcards** — Flip cards to study vocabulary, mark words as known/learning
- **Worksheets** — Generate printable practice sheets with answer keys
- **Student Profiles** — Track progress, accuracy, and words to review (stored locally)
- **Review System** — Missed words automatically saved for targeted practice

---

## Development Workflow

### Updating the Word/Sentence Database

1. Edit your CSV files (in Excel, Google Sheets, etc.)
   - `synonyms.csv` — columns: Word, Synonym, Level
   - `sentences.csv` — columns: Word, Level, Sentence_A, Sentence_B, Sentence_C

2. Save CSVs to the same folder as `convert_csv.py`

3. Run the conversion:
   ```bash
   python convert_csv.py
   ```

4. Copy the generated `synonyms.json` and `sentences.json` into the `data/` folder

5. Push to GitHub (see below)

---

### Making Code Changes or Adding Features

1. Open the project folder in VS Code

2. Edit files as needed:
   - `css/` — styling changes
   - `js/` — functionality changes  
   - `*.html` — page structure changes

3. Test locally:
   ```bash
   python -m http.server 8000
   ```
   Then open `http://localhost:8000`

4. Push to GitHub when working (see below)

---

### Pushing Updates to GitHub (Auto-Deploys to Netlify)

In VS Code:

1. Click **Source Control** icon (left sidebar, or `Ctrl+Shift+G`)

2. Click **+** to stage your changes

3. Type a commit message describing what you changed

4. Click the **checkmark ✓** to commit

5. Click **Sync Changes** or the sync icon in the bottom bar

Your live site updates automatically within ~30 seconds.

---

## Quick Reference

| Task | Action |
|------|--------|
| Update vocabulary | Edit CSV → run `convert_csv.py` → copy JSONs to `data/` → push |
| Fix a bug | Edit code → test locally → push |
| Add a feature | Edit code → test locally → push |
| Roll back a mistake | In VS Code Source Control, view history and revert |

---

## Project Structure

```
isee-verbal-practice/
├── index.html          # Home page with profile management
├── practice.html       # Online quiz interface
├── flashcards.html     # Flashcard study mode
├── worksheet.html      # Worksheet generator
├── css/
│   ├── main.css        # Main styles
│   └── print.css       # Print-optimized styles
├── js/
│   ├── data.js         # Data loading
│   ├── utils.js        # Shared utilities
│   ├── profiles.js     # Profile management
│   ├── practice.js     # Quiz logic
│   ├── flashcards.js   # Flashcard logic
│   └── worksheet.js    # Worksheet generator
├── data/
│   ├── synonyms.json   # Synonym data
│   └── sentences.json  # Sentence completion data
└── convert_csv.py      # CSV to JSON converter
```

---

## Troubleshooting

**Quiz/Flashcards not loading:** Check browser console (F12) for errors. Try hard refresh (`Ctrl+Shift+R`).

**Local testing not working:** Make sure you're running the server from the project folder, not a parent directory.

**Changes not showing on live site:** Check Netlify dashboard for deploy status. Ensure you pushed to GitHub.
