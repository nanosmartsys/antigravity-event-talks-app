import os
import requests
import feedparser
from bs4 import BeautifulSoup
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

# In-memory cache to prevent slamming Google's server
class FeedCache:
    def __init__(self):
        self.data = None
        
    def get_updates(self, force_refresh=False):
        if self.data is None or force_refresh:
            try:
                response = requests.get(FEED_URL, timeout=10)
                if response.status_code == 200:
                    feed = feedparser.parse(response.content)
                    self.data = parse_feed(feed)
                else:
                    # Fallback to current memory cache if remote fetch fails
                    if self.data is None:
                        self.data = []
            except Exception as e:
                print(f"Error fetching feed: {e}")
                if self.data is None:
                    self.data = []
        return self.data

cache = FeedCache()

def parse_feed(feed):
    updates = []
    for entry in feed.entries:
        entry_updates = parse_entry_updates(entry)
        updates.extend(entry_updates)
    return updates

def parse_entry_updates(entry):
    html_content = entry.get('summary', '')
    soup = BeautifulSoup(html_content, 'html.parser')
    
    updates = []
    current_type = None
    current_content = []
    
    for element in soup.contents:
        if element.name == 'h3':
            if current_type and current_content:
                content_html = "".join(str(e) for e in current_content).strip()
                content_text = BeautifulSoup(content_html, 'html.parser').get_text().strip()
                updates.append({
                    'type': current_type,
                    'content_html': content_html,
                    'content_text': content_text,
                    'date': entry.get('title'),
                    'link': entry.get('link'),
                    'id': f"{entry.get('id')}_{len(updates)}"
                })
            current_type = element.get_text().strip()
            current_content = []
        elif current_type:
            current_content.append(element)
            
    if current_type and current_content:
        content_html = "".join(str(e) for e in current_content).strip()
        content_text = BeautifulSoup(content_html, 'html.parser').get_text().strip()
        updates.append({
            'type': current_type,
            'content_html': content_html,
            'content_text': content_text,
            'date': entry.get('title'),
            'link': entry.get('link'),
            'id': f"{entry.get('id')}_{len(updates)}"
        })
        
    if not updates and html_content:
        content_text = soup.get_text().strip()
        updates.append({
            'type': 'Update',
            'content_html': html_content,
            'content_text': content_text,
            'date': entry.get('title'),
            'link': entry.get('link'),
            'id': f"{entry.get('id')}_0"
        })
        
    return updates

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    updates = cache.get_updates(force_refresh=force_refresh)
    return jsonify({
        'status': 'success',
        'count': len(updates),
        'updates': updates
    })

if __name__ == '__main__':
    # Default Flask port is 5000
    app.run(host='127.0.0.1', port=5000, debug=True)
