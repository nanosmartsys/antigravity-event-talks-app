// State Management
let allUpdates = [];
let filteredUpdates = [];
let selectedUpdateId = null;

// DOM Elements
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const refreshBtn = document.getElementById('refreshBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const notesFeed = document.getElementById('notesFeed');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');

// Metrics
const metricAll = document.querySelector('#metricAll .metric-num');
const metricFeature = document.querySelector('#metricFeature .metric-num');
const metricIssue = document.querySelector('#metricIssue .metric-num');
const metricAnnouncement = document.querySelector('#metricAnnouncement .metric-num');

// Filters
const categoryFilters = document.getElementById('categoryFilters');
const timeframeFilters = document.getElementById('timeframeFilters');

// Drawer Elements
const tweetDrawer = document.getElementById('tweetDrawer');
const drawerOverlay = document.getElementById('drawerOverlay');
const closeDrawerBtn = document.getElementById('closeDrawerBtn');
const previewBadge = document.getElementById('previewBadge');
const previewDate = document.getElementById('previewDate');
const previewSnippet = document.getElementById('previewSnippet');
const tweetTextArea = document.getElementById('tweetTextArea');
const charCount = document.getElementById('charCount');
const tweetShareBtn = document.getElementById('tweetShareBtn');
const suggestHashtagsBtn = document.getElementById('suggestHashtagsBtn');
const hashtagPillsContainer = document.querySelector('.hashtag-pills');

// Toast Notification
const toastNotification = document.getElementById('toastNotification');

// Filter values
let currentCategory = 'all';
let currentTimeframe = 'all';
let currentSearch = '';

// Load data on start
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    fetchUpdates(false);
    initEventListeners();
});

// Event Listeners Initialization
function initEventListeners() {
    // Search
    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase().trim();
        clearSearchBtn.style.display = currentSearch ? 'block' : 'none';
        applyFilters();
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        currentSearch = '';
        clearSearchBtn.style.display = 'none';
        searchInput.focus();
        applyFilters();
    });

    // Refresh button
    refreshBtn.addEventListener('click', () => {
        fetchUpdates(true);
    });

    // Export CSV button
    exportCsvBtn.addEventListener('click', exportToCsv);

    // Theme Toggle button
    themeToggleBtn.addEventListener('click', toggleTheme);

    // Reset filters button in empty state
    resetFiltersBtn.addEventListener('click', resetAllFilters);

    // Category filter pills
    categoryFilters.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-pill');
        if (!btn) return;
        
        // Remove active class from siblings
        categoryFilters.querySelectorAll('.filter-pill').forEach(el => el.classList.remove('active'));
        btn.classList.add('active');
        
        currentCategory = btn.dataset.category;
        applyFilters();
    });

    // Timeframe filter pills
    timeframeFilters.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-pill');
        if (!btn) return;

        timeframeFilters.querySelectorAll('.filter-pill').forEach(el => el.classList.remove('active'));
        btn.classList.add('active');

        currentTimeframe = btn.dataset.timeframe;
        applyFilters();
    });

    // Drawer events
    closeDrawerBtn.addEventListener('click', closeTweetDrawer);
    drawerOverlay.addEventListener('click', closeTweetDrawer);
    
    // Esc key to close drawer
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && tweetDrawer.classList.contains('open')) {
            closeTweetDrawer();
        }
    });

    // Tweet text change listener for character counting
    tweetTextArea.addEventListener('input', updateCharCount);

    // Click on hashtag pill in drawer composer
    hashtagPillsContainer.addEventListener('click', (e) => {
        const pill = e.target.closest('.hashtag-pill');
        if (!pill) return;
        
        const hashtag = pill.dataset.tag;
        let currentText = tweetTextArea.value;
        
        if (currentText.includes(hashtag)) {
            // Remove hashtag
            currentText = currentText.replace(new RegExp(`\\s*${hashtag}`, 'g'), '');
            pill.classList.remove('active');
        } else {
            // Add hashtag
            currentText = `${currentText.trim()} ${hashtag}`;
            pill.classList.add('active');
        }
        
        tweetTextArea.value = currentText.trim();
        updateCharCount();
    });

    // Suggest tags button
    suggestHashtagsBtn.addEventListener('click', suggestTags);

    // Final share button
    tweetShareBtn.addEventListener('click', launchTweetIntent);
}

// Fetch Release Notes
async function fetchUpdates(forceRefresh = false) {
    showLoading(true);
    
    // Add spinning class to refresh icon
    const refreshIcon = refreshBtn.querySelector('.icon-refresh');
    if (refreshIcon) refreshIcon.classList.add('spinning');
    
    try {
        const response = await fetch(`/api/release-notes${forceRefresh ? '?refresh=true' : ''}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            allUpdates = data.updates;
            updateMetrics();
            applyFilters();
            if (forceRefresh) {
                showToast('Release notes successfully refreshed!');
            }
        } else {
            showToast('Failed to parse release notes.', true);
        }
    } catch (err) {
        console.error('Error fetching updates:', err);
        showToast('Network error fetching updates.', true);
    } finally {
        showLoading(false);
        if (refreshIcon) refreshIcon.classList.remove('spinning');
    }
}

// Render the updates list
function renderUpdates() {
    notesFeed.innerHTML = '';
    
    if (filteredUpdates.length === 0) {
        emptyState.style.display = 'flex';
        return;
    }
    
    emptyState.style.display = 'none';
    
    filteredUpdates.forEach(update => {
        const card = document.createElement('article');
        card.className = `update-card glass-panel card-type-${update.type}`;
        card.dataset.id = update.id;
        
        // Define badge class based on update type
        let badgeClass = 'badge-default';
        if (update.type === 'Feature') badgeClass = 'badge-feature';
        else if (update.type === 'Announcement') badgeClass = 'badge-announcement';
        else if (update.type === 'Issue') badgeClass = 'badge-issue';
        else if (update.type === 'Changed') badgeClass = 'badge-changed';
        else if (update.type === 'Deprecated') badgeClass = 'badge-deprecated';
        
        card.innerHTML = `
            <div class="card-header">
                <div class="card-meta">
                    <span class="badge ${badgeClass}">${update.type}</span>
                    <span class="card-date">${update.date}</span>
                </div>
            </div>
            <div class="card-body">
                ${update.content_html}
            </div>
            <div class="card-actions">
                <button class="card-action-btn btn-copy" onclick="copyUpdateText('${update.id}')">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Copy
                </button>
                <a href="${update.link}" target="_blank" rel="noopener noreferrer" class="card-action-btn btn-origin">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                    Original
                </a>
                <button class="card-action-btn btn-tweet" onclick="openTweetComposer('${update.id}')">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                    </svg>
                    Tweet
                </button>
            </div>
        `;
        
        notesFeed.appendChild(card);
    });
}

// Apply Category, Timeframe, and Search Filters
function applyFilters() {
    filteredUpdates = allUpdates;
    
    // 1. Category Filter
    if (currentCategory !== 'all') {
        filteredUpdates = filteredUpdates.filter(update => update.type === currentCategory);
    }
    
    // 2. Timeframe Filter
    if (currentTimeframe !== 'all') {
        const boundaryDate = new Date();
        if (currentTimeframe === '7days') {
            boundaryDate.setDate(boundaryDate.getDate() - 7);
        } else if (currentTimeframe === '30days') {
            boundaryDate.setDate(boundaryDate.getDate() - 30);
        }
        
        filteredUpdates = filteredUpdates.filter(update => {
            const updateDate = new Date(update.date);
            return updateDate >= boundaryDate;
        });
    }
    
    // 3. Search Filter
    if (currentSearch) {
        filteredUpdates = filteredUpdates.filter(update => {
            return update.content_text.toLowerCase().includes(currentSearch) ||
                   update.type.toLowerCase().includes(currentSearch) ||
                   update.date.toLowerCase().includes(currentSearch);
        });
    }
    
    renderUpdates();
}

// Update Top Metrics Dashboard
function updateMetrics() {
    metricAll.textContent = allUpdates.length;
    metricFeature.textContent = allUpdates.filter(u => u.type === 'Feature').length;
    metricIssue.textContent = allUpdates.filter(u => ['Issue', 'Changed', 'Deprecated'].includes(u.type)).length;
    metricAnnouncement.textContent = allUpdates.filter(u => u.type === 'Announcement').length;
}

// Open Tweet Composer Drawer
function openTweetComposer(updateId) {
    const update = allUpdates.find(u => u.id === updateId);
    if (!update) return;
    
    selectedUpdateId = updateId;
    
    // Reset hashtags highlight classes in drawer
    hashtagPillsContainer.querySelectorAll('.hashtag-pill').forEach(pill => {
        pill.classList.remove('active');
    });
    
    // Setup drawer content
    previewBadge.textContent = update.type;
    previewBadge.className = `preview-badge badge-${update.type.toLowerCase()}`;
    previewDate.textContent = update.date;
    previewSnippet.textContent = update.content_text;
    
    // Construct prefilled tweet draft text
    // Format: "Google BigQuery Update [Date] (Feature): Brief summary... [Link]"
    const prefix = `BigQuery Update [${update.date}] (${update.type}): `;
    const link = ` ${update.link}`;
    const targetLength = 280 - prefix.length - link.length - 20; // safe margin for hashtags
    
    let textSummary = update.content_text;
    if (textSummary.length > targetLength) {
        textSummary = textSummary.substring(0, targetLength - 3) + '...';
    }
    
    tweetTextArea.value = `${prefix}${textSummary}${link}`;
    
    // Pre-activate default hashtags if appropriate
    const defaultTags = ['#BigQuery', '#GoogleCloud'];
    hashtagPillsContainer.querySelectorAll('.hashtag-pill').forEach(pill => {
        if (defaultTags.includes(pill.dataset.tag)) {
            pill.classList.add('active');
            tweetTextArea.value += ` ${pill.dataset.tag}`;
        }
    });
    
    updateCharCount();
    
    // Open drawer
    tweetDrawer.classList.add('open');
    tweetDrawer.setAttribute('aria-hidden', 'false');
    
    // Auto-focus textarea and place cursor at the end of the text (after drawer slide transition)
    setTimeout(() => {
        tweetTextArea.focus();
        const textVal = tweetTextArea.value;
        tweetTextArea.value = '';
        tweetTextArea.value = textVal;
    }, 300);
}

// Close Tweet Drawer
function closeTweetDrawer() {
    tweetDrawer.classList.remove('open');
    tweetDrawer.setAttribute('aria-hidden', 'true');
    selectedUpdateId = null;
}

// Update Character Count
function updateCharCount() {
    const length = tweetTextArea.value.length;
    charCount.textContent = `${length} / 280`;
    
    charCount.classList.remove('warning', 'error');
    if (length >= 250 && length <= 280) {
        charCount.classList.add('warning');
    } else if (length > 280) {
        charCount.classList.add('error');
    }
}

// Copy update text to clipboard
function copyUpdateText(updateId) {
    const update = allUpdates.find(u => u.id === updateId);
    if (!update) return;
    
    const textToCopy = `BigQuery Update [${update.date}] (${update.type}):\n${update.content_text}\n\nRead more: ${update.link}`;
    
    navigator.clipboard.writeText(textToCopy)
        .then(() => {
            showToast('Update details copied to clipboard!');
        })
        .catch(err => {
            console.error('Copy failed:', err);
            showToast('Copy failed. Please manually select and copy.', true);
        });
}

// Launch Twitter intent share window
function launchTweetIntent() {
    const tweetText = tweetTextArea.value;
    if (tweetText.length > 280) {
        showToast('Tweet exceeds the 280 character limit!', true);
        return;
    }
    
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(shareUrl, '_blank', 'width=550,height=420,toolbar=no,menubar=no,scrollbars=yes');
    closeTweetDrawer();
}

// Suggest hashtags dynamically based on content keywords
function suggestTags() {
    if (!selectedUpdateId) return;
    const update = allUpdates.find(u => u.id === selectedUpdateId);
    if (!update) return;
    
    const text = update.content_text.toLowerCase();
    const tagKeywords = {
        '#GenerativeAI': ['gemini', 'ai ', 'embedding', 'vector', 'model', 'assist'],
        '#DataEngineering': ['table', 'partition', 'schema', 'sql', 'query', 'load', 'export'],
        '#BigQuery': ['bigquery', 'bq'],
        '#GoogleCloud': ['gcp', 'google cloud', 'cloud assist'],
    };
    
    let currentText = tweetTextArea.value;
    
    Object.entries(tagKeywords).forEach(([tag, keywords]) => {
        const matches = keywords.some(keyword => text.includes(keyword));
        if (matches && !currentText.includes(tag)) {
            // Find pill to activate it visually
            const pill = hashtagPillsContainer.querySelector(`.hashtag-pill[data-tag="${tag}"]`);
            if (pill) {
                pill.classList.add('active');
                currentText = `${currentText.trim()} ${tag}`;
            }
        }
    });
    
    tweetTextArea.value = currentText.trim();
    updateCharCount();
}

// Show/Hide loader spinner in content area
function showLoading(isLoading) {
    if (isLoading) {
        loadingState.style.display = 'flex';
        notesFeed.style.display = 'none';
        emptyState.style.display = 'none';
    } else {
        loadingState.style.display = 'none';
        notesFeed.style.display = 'flex';
    }
}

// Show toast notifications
function showToast(message, isError = false) {
    const msgEl = toastNotification.querySelector('.toast-message');
    msgEl.textContent = message;
    
    if (isError) {
        toastNotification.classList.add('toast-error');
    } else {
        toastNotification.classList.remove('toast-error');
    }
    
    toastNotification.classList.add('show');
    
    setTimeout(() => {
        toastNotification.classList.remove('show');
    }, 3000);
}

// Reset all filters
function resetAllFilters() {
    searchInput.value = '';
    currentSearch = '';
    clearSearchBtn.style.display = 'none';
    
    categoryFilters.querySelectorAll('.filter-pill').forEach(el => el.classList.remove('active'));
    categoryFilters.querySelector('.filter-pill[data-category="all"]').classList.add('active');
    currentCategory = 'all';
    
    timeframeFilters.querySelectorAll('.filter-pill').forEach(el => el.classList.remove('active'));
    timeframeFilters.querySelector('.filter-pill[data-timeframe="all"]').classList.add('active');
    currentTimeframe = 'all';
    
    applyFilters();
}

// Export filtered updates to CSV file
function exportToCsv() {
    if (filteredUpdates.length === 0) {
        showToast('No updates to export.', true);
        return;
    }
    
    // CSV Headers
    const headers = ['Date', 'Type', 'Content Text', 'Link', 'ID'];
    const csvRows = [headers.join(',')];
    
    filteredUpdates.forEach(update => {
        // Escape quotes by doubling them, wrap fields in quotes
        const cleanedText = update.content_text.replace(/"/g, '""');
        const cleanedDate = update.date.replace(/"/g, '""');
        const cleanedType = update.type.replace(/"/g, '""');
        const cleanedLink = update.link.replace(/"/g, '""');
        const cleanedId = update.id.replace(/"/g, '""');
        
        const row = [
            `"${cleanedDate}"`,
            `"${cleanedType}"`,
            `"${cleanedText}"`,
            `"${cleanedLink}"`,
            `"${cleanedId}"`
        ];
        csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    const categoryName = currentCategory.toLowerCase();
    const formattedDate = new Date().toISOString().split('T')[0];
    
    link.setAttribute('href', url);
    link.setAttribute('download', `bigquery_releases_${categoryName}_${formattedDate}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('CSV export downloaded successfully!');
}

// Theme Initialization & Toggle
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
    }
}

function toggleTheme() {
    const isLight = document.body.classList.toggle('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    showToast(`${isLight ? 'Light' : 'Dark'} theme applied!`);
}

// Global scope functions to handle onclick attributes in dynamic cards
window.copyUpdateText = copyUpdateText;
window.openTweetComposer = openTweetComposer;
window.exportToCsv = exportToCsv;
window.toggleTheme = toggleTheme;
