let latestData = null;
let referer = "No referer";

chrome.webRequest.onBeforeRequest.addListener((details) => {
    const url = details.url;
    console.log("Request logs:", details);
    console.log("Request detected:", url);

    if (url.includes("player/index.php?data=")) {
        referer = url;
        console.log("Referer:", referer);
    }

    if (url.includes("&q=1080") || url.includes("&q=2160")) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { type: "getDocumentTitle" }, (response) => {
                const title = response ? response.title : "No title";
                latestData = `yt-dlp.exe -N 8 --add-header "${referer}" "${url}" -o "${title}.%(ext)s"`;
                console.log("Latest Data Captured:", latestData);

                chrome.storage.local.set({ latestData: latestData });
            });
        });
    }
},
{
    urls: [
        "https://*.xtremestream.xyz/player/xs1.php?data=*",
        "https://*.xtremestream.xyz/player/index.php?data=*"
    ] 
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "getLatestData") {
        console.log("Sending latest data:", latestData);
        sendResponse({ data: latestData });
        return true;
    }
});

chrome.tabs.onActivated.addListener(() => {
    chrome.storage.local.set({ latestData: null });
});
