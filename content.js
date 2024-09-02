chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    /**
     * Get response body of video source
     * Request from service worker
     */
    if (request.type === 'fetchResponseBody') {
        fetch(request.url)
            .then(response => response.text())
            .then(body => {
                sendResponse({ body: body });
            })
            .catch(error => {
                console.error('Failed to fetch the video response body:', error);
                sendResponse({ body: null });
            });
        return true;
    }
});
