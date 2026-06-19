# ⚡ BigQuery Release Pulse

An elegant, real-time developer dashboard to fetch, organize, filter, and share Google Cloud BigQuery release notes. Built using a Python Flask backend and a modern vanilla HTML5, CSS3, and JavaScript frontend.

## 🚀 Features

* **Granular Release Partitioning**: Automatically parses composite daily Google release notes and breaks them down into individual, categorized updates (e.g. Features, Issues, Changed, Deprecated, Announcements).
* **Intelligent Caching**: Implements an in-memory server cache to minimize requests to Google servers, with an on-demand client-side refresh button.
* **Cyberpunk Dark Theme**: Modern dark-mode interface with glassmorphism panels, glowing typography, custom category badges, and smooth hover effects.
* **Client-Side Filter Engine**: Real-time keyword search indexing and instant filtering by release category or date timeframe (Last 7 Days, Last 30 Days).
* **Interactive Share Drawer**: Select any release note to open a slide-out share panel, prefilled with a structured tweet template. Includes a character counter (280 limit) and toggleable hashtag pills.

## 🛠️ Tech Stack

* **Backend**: Python 3, Flask, Feedparser, BeautifulSoup4, Requests
* **Frontend**: Vanilla HTML5, CSS3 (Custom properties/Grid), JavaScript (ES6)
* **Styling**: Sleek Space-Dark color palette, glassmorphism, responsive column layout

## 📁 Directory Structure

```text
C:\agy-cli-projects\
├── app.py                  # Flask backend (feed parser & API routes)
├── README.md               # Project documentation
├── .gitignore              # Files to ignore in git commits
├── templates/
│   └── index.html          # Semantic HTML5 dashboard template
└── static/
    ├── css/
    │   └── styles.css      # Custom stylesheet (dark theme & responsive grid)
    └── js/
        └── app.js          # Client-side routing, filtering, and Twitter composer
```

## ⚙️ Getting Started

### Prerequisites
Make sure Python 3 is installed.

### Setup and Running
1. Clone this repository or navigate to the directory:
   ```bash
   cd C:\agy-cli-projects
   ```

2. Create a virtual environment and activate it:
   ```bash
   # Windows PowerShell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. Install the dependencies:
   ```bash
   pip install flask requests feedparser beautifulsoup4
   ```

4. Run the development server:
   ```bash
   python app.py
   ```

5. Open your browser and navigate to **`http://127.0.0.1:5000`**.

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
