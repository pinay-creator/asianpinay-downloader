/**
 * On web request when headers received,
 * Get previous tab data from data storage (*if any)
 * Get formatted response body from the video iframe
 * Store (*Update) the page url and formatted response body
 * Fixed:
 * - "Error: The message port closed before a response was received" - explicitly injected the content script
 */
chrome.webRequest.onHeadersReceived.addListener(async (details) => {
    const url = details.url;
    const currentTabId = details.tabId;
    const previousTabData = await getCurrentTabData(currentTabId);
    if (previousTabData && previousTabData?.url !== url) {
        await chrome.scripting.executeScript({ target: { tabId: currentTabId }, files: ['content.js'] }, async () => {
            const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { type: 'fetchResponseBody', url: getVideoPathName(url) });
            if (response?.body || response.body !== '') {
                const pageTitles = await chrome.storage.session.get('pageTitle');
                const videoResponseData = await getVideoResponseBody(response.body, url, pageTitles.pageTitle);
                await setCurrentTabData(currentTabId, { url: url, videoData: videoResponseData }, previousTabData);
            }
        });
    }
}, { urls: ['https://*.xtremestream.xyz/player/index.php*'] });

/**
 * On tab close,
 * Delete current tab data from data storage
 */
chrome.tabs.onRemoved.addListener(async (tabId) => {
    await deleteCurrentTabData(tabId);
});

/**
 * On tab active (focus),
 * Update the current tab page data from data storage
 */
chrome.tabs.onActivated.addListener(async (details) => {
    await chrome.storage.session.set({ currentTabId: details.tabId.toString() });
    if (!await isRunningBackgroundAllowed()) {
        return;
    }
    await updatePageData(details.tabId);
});

/**
 * On tab updates (url changes), 
 * Update the current tab page data from data storage
 */
chrome.tabs.onUpdated.addListener(async (tabId) => {
    if (!await isRunningBackgroundAllowed()) {
        return;
    }
    await updatePageData(tabId);
});


/**
 * Get current tab data from data storage
 * @param { integer } currentTabId
 * @returns { Promise }
 */
function getCurrentTabData(currentTabId) {
    return new Promise((resolve) => {
        chrome.storage.session.get(currentTabId.toString(), (currentTabsData) => {
            const currentTabData = currentTabsData[currentTabId] || {};
            resolve(currentTabData);
        });
    });
}

/**
 * Get working video path name
 * URL Format: https://*.xtremestream.xyz/player/xs*.php?data=*&q=*
 * Note: Not sure if all video plays with /xs0.php
 * @param { string } url
 * @param { integer } iteration
 * @returns { string }
 */
function getVideoPathName(url, iteration = 0) {
    const newUrl = new URL(url);
    const urlPathName = newUrl.pathname.split('/');
    urlPathName[2] = `xs${iteration}.php`; 
    return newUrl.origin + urlPathName.join('/') + newUrl.search;
}

/**
 * Get video response body
 * @param { string } responseBody
 * @param { string } referer
 * @param { string } pageTitle
 * @returns { object }
 */
function getVideoResponseBody(responseBody, referer, pageTitle) {
    return new Promise((resolve) => {
        const videoResponseData = {};
        const responseLines = responseBody.trim().split('\n');
        if (responseLines && responseLines[0] !== '#EXTM3U') {
            return resolve(videoResponseData);
        }
        for (let lineNumber = 0; lineNumber < responseLines.length; lineNumber++) {
            if (responseLines[lineNumber].startsWith('#EXT-X-STREAM-INF')) {
                const videoParams = RegExp(/BANDWIDTH=(\d+),RESOLUTION=(\d+x\d+),CLOSED-CAPTIONS=(\w+)/).exec(responseLines[lineNumber]);
                const videoUrl = responseLines[lineNumber + 1].trim();
                const [, videoQuality] = videoParams[2].split('x');
                if (videoParams) {
                    videoResponseData[videoQuality] = {
                        bandwidth: videoParams[1],
                        resolution: videoParams[2],
                        cc: videoParams[3],
                        download: `./yt-dlp.exe -N 8 --add-header "${referer}" "${videoUrl}" -o "${pageTitle}.%(ext)s"`
                    };
                }
            }
        }
        resolve(videoResponseData);
    });
}

/**
 * Store current tab data to data storage (combine with previous tab data)
 * @param { integer } currentTabId
 * @param { object } currentTabData
 * @param { object } previousTabData
 * @returns { Promise }
 */
function setCurrentTabData(currentTabId, currentTabData, previousTabData = {}) {
    return new Promise((resolve) => {
        chrome.storage.session.set({ [currentTabId.toString()]: { ...previousTabData, ...currentTabData } });
        resolve();
    });
}

/**
 * Delete current tab data from data storage
 * Identifier: Current Tab Id (converted to string)
 * @param { integer } currentTabId
 * @returns { Promise }
 */
function deleteCurrentTabData(currentTabId) {
    return new Promise((resolve) => {
        chrome.storage.session.remove(currentTabId.toString());
        resolve();
    });
}

/**
 * Check if background script will run on the current domain
 * @returns { Promise }
 */
function isRunningBackgroundAllowed() {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, ([tab]) => {
            if (!tab?.url || tab.url === '') {
                return resolve(false);
            }
            const isAllowedDomain = ['https://*.asianpinay.com/*', 'https://*.asianpinay.to/*'].some(
                domain => new URL(tab.url).hostname.endsWith(domain.split('https://*.')[1].split('/*')[0])
            )
            resolve(isAllowedDomain);
        });
    });
}

/**
 * Update current tab page data from data storage
 * Fixed:
 * - "Error: The message port closed before a response was received" - explicitly injected the content script
 * @param { integer } currentTabId 
 * @returns { Promise }
 */
function updatePageData(currentTabId) {
    return new Promise((resolve) => {
        if (!currentTabId) {
            return resolve();
        }
        chrome.scripting.executeScript({ target: { tabId: currentTabId }, files: ['content.js'] }, async () => {
            const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
            await chrome.storage.session.set({ currentTabId: currentTabId.toString(), pageTitle: tab ? tab.title : 'No title' });
            resolve();
        });
    });
}
