chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "getDocumentTitle") {
        const title = document.title;
        sendResponse({ title: title });
        return true;
    }
});
