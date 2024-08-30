document.addEventListener('DOMContentLoaded', () => {
    const dataElement = document.getElementById('data');
    const copyButton = document.getElementById('copyButton');
    const descriptionText = document.getElementById('description');
    const description2Text = document.getElementById('description-2');

    // Retrieve the latest data from chrome.storage
    chrome.storage.local.get('latestData', (result) => {
        const latestData = result.latestData;

        if (latestData) {
            dataElement.textContent = latestData;
            copyButton.disabled = false;
            descriptionText.style.display = 'none';
            description2Text.style.display = 'block';
        } else {
            dataElement.textContent = "No data captured yet.";
            descriptionText.style.display = 'block';
            description2Text.style.display = 'none';
        }
    });

    // Copy data to clipboard
    copyButton.addEventListener('click', () => {
        const textToCopy = dataElement.textContent;
        if (textToCopy && textToCopy !== "No data captured yet.") {
            navigator.clipboard.writeText(textToCopy).then(() => {
                alert("Open command line where yt-dlp.exe is located. And paste this shit!");
            }).catch(err => {
                console.error("Clipboard copy failed:", err);
            });
        }
    });
});
