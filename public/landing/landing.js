/* NekoAPI — Modern Developer Dashboard Logic */

let globalConfig = null;
let allEndpointsList = [];
let selectedEndpoint = null;
let currentTab = 'js';
let lastResponseData = null;

// Categories definition with icons and meta
const categoryMeta = {
    anime: {
        icon: 'fa-solid fa-wand-magic-sparkles',
        badge: 'Anime & Waifu',
        color: 'from-pink-500/20 to-purple-500/10 text-pink-500',
        hubEndpoint: '/api/waifu'
    },
    quotes: {
        icon: 'fa-solid fa-quote-left',
        badge: 'Quotes & Wisdom',
        color: 'from-amber-500/20 to-orange-500/10 text-amber-500',
        hubEndpoint: '/api/quote'
    },
    random: {
        icon: 'fa-solid fa-dice-d20',
        badge: 'Random Hub',
        color: 'from-indigo-500/20 to-blue-500/10 text-indigo-500',
        hubEndpoint: '/api/random'
    },
    tools: {
        icon: 'fa-solid fa-wrench',
        badge: 'Developer Tools',
        color: 'from-emerald-500/20 to-teal-500/10 text-emerald-500',
        hubEndpoint: '/api/tools'
    },
    search: {
        icon: 'fa-solid fa-magnifying-glass',
        badge: 'Media Search',
        color: 'from-cyan-500/20 to-sky-500/10 text-cyan-500',
        hubEndpoint: '/api/search'
    },
    download: {
        icon: 'fa-solid fa-cloud-arrow-down',
        badge: 'Media Downloader',
        color: 'from-violet-500/20 to-purple-500/10 text-violet-500',
        hubEndpoint: '/api/download'
    },
    maker: {
        icon: 'fa-solid fa-palette',
        badge: 'Image Maker',
        color: 'from-lime-500/20 to-emerald-500/10 text-lime-500',
        hubEndpoint: '/api/maker'
    }
};

// Preset sample values for parameter testing
const paramPresets = {
    url: 'https://github.com',
    q: 'lofi hip hop',
    text: 'nekoapi rocks',
    alias: 'nekolink',
    category: 'anime',
    lang: 'id'
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initMobileNav();
    loadApiConfig();
    performHealthCheck();
});

// --- Theme Management ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.classList.add('dark');
        updateThemeIcon(true);
    } else {
        document.documentElement.classList.remove('dark');
        updateThemeIcon(false);
    }

    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            updateThemeIcon(isDark);
        });
    }
}

function updateThemeIcon(isDark) {
    const icon = document.getElementById('theme-icon');
    if (!icon) return;
    if (isDark) {
        icon.className = 'fa-solid fa-sun text-sm text-amber-400';
    } else {
        icon.className = 'fa-solid fa-moon text-sm text-zinc-600';
    }
}

// --- Mobile Navigation ---
function initMobileNav() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    if (!btn || !menu) return;

    btn.addEventListener('click', () => {
        menu.classList.toggle('hidden');
    });

    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', () => menu.classList.add('hidden'));
    });
}

// --- Health Check & Latency ---
async function performHealthCheck() {
    const start = performance.now();
    try {
        const res = await fetch('/api/tools');
        const duration = Math.round(performance.now() - start);
        
        const latencyText = document.getElementById('latency-text');
        const statLatency = document.getElementById('stat-latency');
        if (latencyText) latencyText.textContent = `· ${duration}ms`;
        if (statLatency) statLatency.textContent = `${duration}ms`;
    } catch {
        const statusText = document.getElementById('status-text');
        if (statusText) statusText.textContent = 'Degraded';
    }
}

// --- Toast System ---
let toastTimer = null;
function showToast(message, isSuccess = true) {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toast-icon');
    const toastMessage = document.getElementById('toast-message');

    if (!toast) return;

    toastMessage.textContent = message;
    if (isSuccess) {
        toastIcon.className = 'fa-solid fa-circle-check text-emerald-500';
    } else {
        toastIcon.className = 'fa-solid fa-triangle-exclamation text-rose-500';
    }

    toast.classList.add('show');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 2400);
}

// --- Load Config & Populate Data ---
async function loadApiConfig() {
    try {
        const res = await fetch('/config');
        if (!res.ok) throw new Error('Gagal memuat konfigurasi API');
        globalConfig = await res.json();

        // Update header & hero metadata
        if (globalConfig.settings) {
            const s = globalConfig.settings;
            if (s.apiName) {
                document.querySelectorAll('#nav-name, #dash-title').forEach(el => el.textContent = s.apiName);
            }
            if (s.description) {
                const heroDesc = document.getElementById('hero-desc');
                if (heroDesc) heroDesc.textContent = s.description;
            }
            if (s.creator) {
                const footerCreator = document.getElementById('footer-creator');
                if (footerCreator) footerCreator.textContent = s.creator;
            }
        }

        // Process Endpoints by Tag
        const tags = globalConfig.tags || {};
        allEndpointsList = [];

        Object.keys(tags).forEach(categoryKey => {
            const routes = tags[categoryKey];
            if (Array.isArray(routes)) {
                routes.forEach(route => {
                    allEndpointsList.push({
                        ...route,
                        category: categoryKey
                    });
                });
            }
        });

        // Update Stats Counters
        const statEndpoints = document.getElementById('stat-endpoints');
        if (statEndpoints) statEndpoints.textContent = `${allEndpointsList.length} APIs`;

        // Render Category Cards & Selectors
        renderCategoryCards(tags);
        populateEndpointSelector();

        // Select default endpoint (/api/waifu or first)
        const defaultEp = allEndpointsList.find(e => e.endpoint === '/api/waifu') || allEndpointsList[0];
        if (defaultEp) {
            selectEndpoint(defaultEp.endpoint);
        }
    } catch (err) {
        console.error('Error loading config:', err);
        showToast('Gagal memuat katalog API', false);
    }
}

// --- Render Category Cards ---
function renderCategoryCards(tags) {
    const container = document.getElementById('category-cards');
    if (!container) return;
    container.innerHTML = '';

    const categories = Object.keys(tags);
    const countBadge = document.getElementById('category-count-badge');
    if (countBadge) countBadge.textContent = `${categories.length} Categories`;

    categories.forEach(categoryKey => {
        const routes = tags[categoryKey] || [];
        const meta = categoryMeta[categoryKey] || {
            icon: 'fa-solid fa-cube',
            badge: categoryKey.toUpperCase(),
            color: 'from-indigo-500/20 to-purple-500/10 text-indigo-500',
            hubEndpoint: routes[0]?.endpoint || `/api/${categoryKey}`
        };

        // Find primary standalone endpoint or first route
        const hubRoute = routes.find(r => r.endpoint === meta.hubEndpoint) || routes[0] || {
            name: `${categoryKey} Hub`,
            endpoint: `/api/${categoryKey}`,
            method: 'GET',
            description: `Kategori ${categoryKey}`
        };

        const card = document.createElement('div');
        card.className = 'category-card group rounded-2xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#11141c] p-5 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md flex flex-col justify-between';

        const descriptionText = hubRoute.description || `Layanan ${meta.badge} terintegrasi`;

        card.innerHTML = `
            <div class="space-y-3.5">
                <div class="flex items-center justify-between">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center text-lg">
                        <i class="${meta.icon}"></i>
                    </div>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-zinc-100 dark:bg-zinc-800/90 text-zinc-600 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/60">
                        Zero Query Params
                    </span>
                </div>

                <div>
                    <h3 class="font-bold text-base text-zinc-900 dark:text-white">${hubRoute.name || meta.badge}</h3>
                    <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">${descriptionText}</p>
                </div>

                <!-- Endpoint Monospace Pill -->
                <div class="flex items-center gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 font-mono text-xs">
                    <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">GET</span>
                    <span class="text-zinc-700 dark:text-zinc-300 truncate">${hubRoute.endpoint}</span>
                </div>
            </div>

            <!-- Card Actions -->
            <div class="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-2">
                <button onclick="runQuickEndpoint('${hubRoute.endpoint}')" class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white text-xs font-semibold transition-colors shadow-sm">
                    <i class="fa-solid fa-play text-[10px]"></i>
                    <span>Execute</span>
                </button>
                <button onclick="copyUrl('${hubRoute.endpoint}')" title="Copy Endpoint URL" class="px-2.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700/80 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs transition-colors">
                    <i class="fa-regular fa-copy"></i>
                </button>
                <button onclick="selectAndScroll('${hubRoute.endpoint}')" title="Open in Tester Console" class="px-2.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700/80 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs transition-colors">
                    <i class="fa-solid fa-terminal"></i>
                </button>
            </div>
        `;

        container.appendChild(card);
    });
}

// --- Populate Dropdown ---
function populateEndpointSelector() {
    const select = document.getElementById('endpoint-selector');
    if (!select) return;

    select.innerHTML = '';
    const groups = {};

    allEndpointsList.forEach(ep => {
        const cat = ep.category || 'General';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(ep);
    });

    Object.keys(groups).forEach(cat => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = `Category: ${cat.toUpperCase()}`;

        groups[cat].forEach(ep => {
            const opt = document.createElement('option');
            opt.value = ep.endpoint;
            opt.textContent = `${ep.method} ${ep.endpoint} — ${ep.name}`;
            optgroup.appendChild(opt);
        });

        select.appendChild(optgroup);
    });

    select.addEventListener('change', (e) => {
        selectEndpoint(e.target.value);
    });
}

// --- Select Active Endpoint ---
function selectEndpoint(endpointPath) {
    const ep = allEndpointsList.find(e => e.endpoint === endpointPath);
    if (!ep) return;
    selectedEndpoint = ep;

    // Update Dropdown value
    const select = document.getElementById('endpoint-selector');
    if (select) select.value = endpointPath;

    // Update Request Controls
    const methodBadge = document.getElementById('active-method');
    const pathText = document.getElementById('active-endpoint-path');
    const categoryPill = document.getElementById('active-category-pill');
    const descText = document.getElementById('active-endpoint-desc');

    if (methodBadge) methodBadge.textContent = ep.method || 'GET';
    if (pathText) pathText.textContent = ep.endpoint;
    if (categoryPill) categoryPill.textContent = ep.category || 'api';
    if (descText) descText.textContent = ep.description || ep.name || '';

    // Render Query Parameters if available
    renderParamsInputs(ep);

    // Update Quick cURL Preview
    updateCurlPreview();

    // Update Multi-language Snippet
    renderSnippet();
}

function selectAndScroll(endpointPath) {
    selectEndpoint(endpointPath);
    const testerSection = document.getElementById('tester');
    if (testerSection) {
        testerSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// --- Quick Runner from Hero & Cards ---
async function runQuickEndpoint(endpointPath) {
    selectEndpoint(endpointPath);
    const testerSection = document.getElementById('tester');
    if (testerSection) {
        testerSection.scrollIntoView({ behavior: 'smooth' });
    }
    await executeCurrentEndpoint();
}

// --- Parameter Form Rendering ---
function renderParamsInputs(ep) {
    const section = document.getElementById('params-section');
    const container = document.getElementById('params-container');
    if (!section || !container) return;

    const params = ep.params || [];
    if (params.length === 0) {
        section.classList.add('hidden');
        container.innerHTML = '';
        return;
    }

    section.classList.remove('hidden');
    container.innerHTML = '';

    params.forEach(param => {
        const paramName = param.name;
        const isRequired = Boolean(param.required);
        const presetVal = paramPresets[paramName] || '';

        const row = document.createElement('div');
        row.className = 'space-y-1';
        row.innerHTML = `
            <div class="flex items-center justify-between text-xs font-mono">
                <span class="font-semibold text-zinc-700 dark:text-zinc-300">${paramName}</span>
                <span class="${isRequired ? 'text-rose-500 font-bold' : 'text-zinc-400'}">${isRequired ? 'Wajib' : 'Opsional'}</span>
            </div>
            <input type="text" data-param-name="${paramName}" value="${presetVal}" placeholder="${param.description || paramName}" class="param-input w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 rounded-lg px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500">
        `;

        container.appendChild(row);

        row.querySelector('input')?.addEventListener('input', () => {
            updateCurlPreview();
            renderSnippet();
        });
    });
}

// Build URL with current params
function buildCurrentRequestUrl() {
    if (!selectedEndpoint) return window.location.origin;

    const base = `${window.location.origin}${selectedEndpoint.endpoint}`;
    const paramInputs = document.querySelectorAll('.param-input');
    const query = new URLSearchParams();

    paramInputs.forEach(input => {
        const name = input.getAttribute('data-param-name');
        const val = input.value.trim();
        if (name && val) {
            query.append(name, val);
        }
    });

    const queryString = query.toString();
    return queryString ? `${base}?${queryString}` : base;
}

function updateCurlPreview() {
    const preview = document.getElementById('curl-preview');
    if (!preview) return;
    const url = buildCurrentRequestUrl();
    preview.textContent = `curl -X GET "${url}"`;
}

// --- Execute Request ---
async function executeCurrentEndpoint() {
    if (!selectedEndpoint) return;

    const btn = document.getElementById('btn-execute');
    const icon = document.getElementById('execute-icon');
    const text = document.getElementById('execute-text');
    const loader = document.getElementById('response-loader');
    const jsonViewer = document.getElementById('json-viewer');
    const statusBadge = document.getElementById('res-status-badge');
    const latencyBadge = document.getElementById('res-latency-badge');
    const mediaCard = document.getElementById('media-preview-card');
    const copyBtn = document.getElementById('btn-copy-response');
    const contentTypeText = document.getElementById('response-content-type');

    // Set Loading State
    btn.disabled = true;
    loader.classList.remove('hidden');
    icon.className = 'fa-solid fa-circle-notch fa-spin text-xs';
    text.textContent = 'Executing...';
    mediaCard.classList.add('hidden');

    const requestUrl = buildCurrentRequestUrl();
    const startTime = performance.now();

    try {
        const response = await fetch(requestUrl);
        const duration = Math.round(performance.now() - startTime);

        // Update latency & status
        latencyBadge.textContent = `${duration}ms`;
        latencyBadge.classList.remove('hidden');

        statusBadge.textContent = `${response.status} ${response.statusText || (response.ok ? 'OK' : 'Error')}`;
        if (response.ok) {
            statusBadge.className = 'px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
        } else {
            statusBadge.className = 'px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
        }

        const contentType = response.headers.get('content-type') || '';
        if (contentTypeText) contentTypeText.textContent = contentType.split(';')[0] || 'application/json';

        if (contentType.includes('image/')) {
            // Raw binary image response (e.g. Brat)
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            
            showMediaPreview(objectUrl, selectedEndpoint.name || 'Generated Image', 'NekoAPI Image Service', requestUrl);
            jsonViewer.textContent = JSON.stringify({
                status: true,
                type: contentType,
                size_bytes: blob.size,
                message: 'Binary image returned directly. Rendered in the preview panel above.'
            }, null, 2);
            lastResponseData = { type: contentType, size: blob.size };
        } else {
            // JSON Response
            const data = await response.json();
            lastResponseData = data;
            jsonViewer.textContent = JSON.stringify(data, null, 2);

            // Check if JSON contains an image URL (waifu, blue archive, etc.)
            const possibleImageUrl = data.url || data.result?.url || data.image || data.result?.image;
            if (possibleImageUrl && typeof possibleImageUrl === 'string' && possibleImageUrl.startsWith('http')) {
                const artistName = data.artist || data.result?.artist || data.source || 'Anime Artist';
                showMediaPreview(possibleImageUrl, data.category ? `Random ${data.category}` : 'Artwork Preview', `Source: ${artistName}`, possibleImageUrl);
            }
        }

        copyBtn.disabled = false;
        showToast('Request executed successfully!');
    } catch (err) {
        const duration = Math.round(performance.now() - startTime);
        latencyBadge.textContent = `${duration}ms`;
        latencyBadge.classList.remove('hidden');

        statusBadge.textContent = 'Failed';
        statusBadge.className = 'px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';

        const errorPayload = {
            status: false,
            error: 'Network / Client Error',
            message: err.message || 'Tidak dapat terhubung ke server API.',
            endpoint: requestUrl
        };
        lastResponseData = errorPayload;
        jsonViewer.textContent = JSON.stringify(errorPayload, null, 2);
        copyBtn.disabled = false;
        showToast('Request gagal: ' + (err.message || 'Network error'), false);
    } finally {
        btn.disabled = false;
        loader.classList.add('hidden');
        icon.className = 'fa-solid fa-play text-xs';
        text.textContent = 'Execute Endpoint';
    }
}

function showMediaPreview(imgSrc, title, subtitle, sourceLink) {
    const card = document.getElementById('media-preview-card');
    const img = document.getElementById('media-preview-img');
    const titleEl = document.getElementById('media-preview-title');
    const subtitleEl = document.getElementById('media-preview-artist');
    const linkEl = document.getElementById('media-preview-link');

    if (!card || !img) return;

    img.src = imgSrc;
    if (titleEl) titleEl.textContent = title;
    if (subtitleEl) subtitleEl.textContent = subtitle;
    if (linkEl) linkEl.href = sourceLink;

    card.classList.remove('hidden');
}

// --- Copy Helpers ---
function copyUrl(endpointPath) {
    const fullUrl = `${window.location.origin}${endpointPath}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
        showToast(`Copied ${endpointPath}`);
    });
}

function copyCurrentUrl() {
    const url = buildCurrentRequestUrl();
    navigator.clipboard.writeText(url).then(() => {
        showToast('Endpoint URL copied to clipboard!');
    });
}

function copyCurlSnippet() {
    const url = buildCurrentRequestUrl();
    const cmd = `curl -X GET "${url}"`;
    navigator.clipboard.writeText(cmd).then(() => {
        showToast('cURL command copied!');
    });
}

function copyResponseJson() {
    if (!lastResponseData) return;
    const text = typeof lastResponseData === 'string' ? lastResponseData : JSON.stringify(lastResponseData, null, 2);
    navigator.clipboard.writeText(text).then(() => {
        showToast('Response JSON copied to clipboard!');
    });
}

// --- Multi-language Code Generator ---
function setSnippetTab(tab) {
    currentTab = tab;
    const tabs = ['js', 'curl', 'python', 'php'];
    tabs.forEach(t => {
        const btn = document.getElementById(`tab-${t}`);
        if (!btn) return;
        if (t === tab) {
            btn.className = 'px-3 py-1.5 text-xs font-mono font-medium rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20';
        } else {
            btn.className = 'px-3 py-1.5 text-xs font-mono font-medium rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white';
        }
    });

    renderSnippet();
}

function renderSnippet() {
    const box = document.getElementById('code-snippet-box');
    if (!box) return;

    const url = buildCurrentRequestUrl();

    if (currentTab === 'curl') {
        box.textContent = `# cURL Request
curl -X GET "${url}" \\
  -H "Accept: application/json"`;
    } else if (currentTab === 'python') {
        box.textContent = `# Python (requests)
import requests

url = "${url}"
headers = {"Accept": "application/json"}

response = requests.get(url, headers=headers, timeout=10)
data = response.json()
print(data)`;
    } else if (currentTab === 'php') {
        box.textContent = `<?php
// PHP cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "${url}");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Accept: application/json"]);

$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
print_r($data);`;
    } else {
        // JavaScript Fetch
        box.textContent = `// Modern JavaScript (Fetch API)
const response = await fetch("${url}", {
  headers: {
    "Accept": "application/json"
  }
});

const data = await response.json();
console.log(data);`;
    }
}

function copyActiveSnippet() {
    const box = document.getElementById('code-snippet-box');
    if (!box) return;
    navigator.clipboard.writeText(box.textContent).then(() => {
        showToast('Code snippet copied to clipboard!');
    });
}
