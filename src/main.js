/**
 * Community Weather Station - メインアプリケーションロジック
 */

import { WeatherCanvas } from './weatherCanvas.js';
import { Forecaster } from './forecaster.js';

// ---------- DOM Elements ----------
const searchForm = document.getElementById('searchForm');
const keywordInput = document.getElementById('keywordInput');
const searchBtn = document.getElementById('searchBtn');
const searchSection = document.getElementById('searchSection');
const loadingSection = document.getElementById('loadingSection');
const loadingSubtext = document.getElementById('loadingSubtext');
const resultSection = document.getElementById('resultSection');
const forecasterBox = document.getElementById('forecasterBox');
const searchAgainContainer = document.getElementById('searchAgainContainer');
const searchAgainBtn = document.getElementById('searchAgainBtn');

// Result elements
const weatherEmoji = document.getElementById('weatherEmoji');
const weatherLabel = document.getElementById('weatherLabel');
const weatherKeyword = document.getElementById('weatherKeyword');
const sentimentPositive = document.getElementById('sentimentPositive');
const sentimentNeutral = document.getElementById('sentimentNeutral');
const sentimentNegative = document.getElementById('sentimentNegative');
const positiveValue = document.getElementById('positiveValue');
const neutralValue = document.getElementById('neutralValue');
const negativeValue = document.getElementById('negativeValue');
const rootCauseText = document.getElementById('rootCauseText');
const sourcesList = document.getElementById('sourcesList');
const sourcesCard = document.getElementById('sourcesCard');

// ---------- Weather Emojis ----------
const WEATHER_EMOJIS = {
    sunny: '☀️',
    partly_cloudy: '⛅',
    cloudy: '☁️',
    rainy: '🌧️',
    storm: '⛈️',
};

// ---------- Initialize ----------
const weatherCanvas = new WeatherCanvas('weatherCanvas');
const forecaster = new Forecaster('forecasterMessage');

// ---------- Loading Messages ----------
const LOADING_MESSAGES = [
    '検索データを収集しています',
    'SNSの投稿を分析中...',
    'ネットの空気感を読み取り中...',
    '天気のパターンを解析中...',
    '予報を生成しています...',
];

let loadingInterval = null;

function startLoadingMessages() {
    let idx = 0;
    loadingInterval = setInterval(() => {
        idx = (idx + 1) % LOADING_MESSAGES.length;
        loadingSubtext.textContent = LOADING_MESSAGES[idx];
    }, 2000);
}

function stopLoadingMessages() {
    if (loadingInterval) {
        clearInterval(loadingInterval);
        loadingInterval = null;
    }
}

// ---------- Show / Hide Sections ----------
function showSection(section) {
    section.classList.remove('hidden');
}

function hideSection(section) {
    section.classList.add('hidden');
}

function showLoading() {
    hideSection(searchSection);
    hideSection(resultSection);
    hideSection(forecasterBox);
    hideSection(searchAgainContainer);
    showSection(loadingSection);
    startLoadingMessages();
}

function showResults(data) {
    stopLoadingMessages();
    hideSection(loadingSection);

    // Set weather class on body
    document.body.className = `weather-${data.weather}`;

    // Update weather canvas
    weatherCanvas.setWeather(data.weather);

    // Weather status
    weatherEmoji.textContent = WEATHER_EMOJIS[data.weather] || '🌤️';
    weatherLabel.textContent = data.weatherLabel;
    weatherKeyword.textContent = `「${data.keyword}」界隈の天気`;

    // Analysis Sources Badges
    const sourcesContainer = document.getElementById('analysisSources');
    if (data.analysisSources && data.analysisSources.length > 0) {
        sourcesContainer.innerHTML = '';
        data.analysisSources.forEach(source => {
            const badge = document.createElement('span');
            badge.className = `source-badge ${source.toLowerCase()}`;
            badge.innerHTML = `<span class="badge-icon">${source === 'Gemini' ? '✨' : '🚀'}</span> ${source}`;
            sourcesContainer.appendChild(badge);
        });
        showSection(sourcesContainer);
    } else {
        hideSection(sourcesContainer);
    }

    // Sentiment bar (animate with slight delay)
    setTimeout(() => {
        sentimentPositive.style.width = `${data.positive}%`;
        sentimentNeutral.style.width = `${data.neutral}%`;
        sentimentNegative.style.width = `${data.negative}%`;
    }, 200);
    positiveValue.textContent = data.positive;
    neutralValue.textContent = data.neutral;
    negativeValue.textContent = data.negative;

    // Root cause
    rootCauseText.textContent = data.rootCause;

    // Highlighted Event
    const highlightedDetails = document.getElementById('highlightedEventText');
    if (highlightedDetails) {
        highlightedDetails.textContent = data.highlightedEvent || '';
    }

    // Sources
    if (data.sources && data.sources.length > 0) {
        sourcesList.innerHTML = '';
        data.sources.forEach((src) => {
            const li = document.createElement('li');
            li.className = 'source-item';
            li.innerHTML = `
        <p class="source-title">${escapeHtml(src.title)}</p>
        <p class="source-snippet">${escapeHtml(src.snippet)}</p>
      `;
            sourcesList.appendChild(li);
        });
        showSection(sourcesCard);
    } else {
        hideSection(sourcesCard);
    }

    // Show result section
    showSection(resultSection);
    showSection(searchAgainContainer);

    // Forecaster message with delay
    setTimeout(() => {
        showSection(forecasterBox);
        forecaster.showMessage(data.forecasterMessage, 35);
    }, 600);
}

function showError(message) {
    stopLoadingMessages();
    hideSection(loadingSection);
    showSection(searchSection);
    alert(message);
}

function resetToSearch() {
    hideSection(resultSection);
    hideSection(forecasterBox);
    hideSection(searchAgainContainer);
    showSection(searchSection);
    document.body.className = '';
    weatherCanvas.setWeather('idle');
    forecaster.clear();
    keywordInput.value = '';
    keywordInput.focus();

    // Reset sentiment bars
    sentimentPositive.style.width = '0%';
    sentimentNeutral.style.width = '0%';
    sentimentNegative.style.width = '0%';
}

// ---------- API Call ----------
async function analyzeKeyword(keyword) {
    const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `サーバーエラー (${response.status})`);
    }

    return response.json();
}

// ---------- Event Handlers ----------
searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const keyword = keywordInput.value.trim();
    if (!keyword) return;

    searchBtn.disabled = true;
    showLoading();

    try {
        const data = await analyzeKeyword(keyword);
        showResults(data);
    } catch (err) {
        console.error('Analysis error:', err);
        showError(`エラー: ${err.message}`);
    } finally {
        searchBtn.disabled = false;
    }
});

searchAgainBtn.addEventListener('click', () => {
    resetToSearch();
});

// ---------- Utility ----------
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
