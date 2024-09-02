document.addEventListener('DOMContentLoaded', async () => {
    const selectElement = document.getElementById('quality');
    const dataElement = document.getElementById('data');
    const buttonElement = document.getElementById('copyButton');
    const currentTabsId = await chrome.storage.session.get('currentTabId');
    const currentTabId = currentTabsId.currentTabId;
    const currentTabsData = await chrome.storage.session.get(currentTabId);
    const textContentDefault = 'No data captured yet.';
    let currentVideoTabData = [];
    
    resetToDefaultDOM();
    setValuesToDOM();

    /**
     * Add listener for copy function
     */
    copyButton.addEventListener('click', () => {
        const textToCopy = dataElement.textContent;
        if (textToCopy && textToCopy !== 'No data captured yet.') {
            navigator.clipboard.writeText(textToCopy).then(() => {
                alert('Copied📝!  now paste this on command line where yt-dlp.exe is located.');
            }).catch(error => {
                console.error('Clipboard copy failed:', error);
            });
        }
    });

    /**
     * Reset values to default
     */
    function resetToDefaultDOM() {
        const firstOption = selectElement.options[0];
        selectElement.innerHTML = '';
        selectElement.append(firstOption);
        selectElement.selectedIndex = 0;
        dataElement.textContent = textContentDefault;
        buttonElement.disabled = true;
    }

    /**
     * Set values from data source to DOM
     */
    function setValuesToDOM() {
        if (currentTabsData[currentTabId]?.videoData) {
            currentVideoTabData = currentTabsData[currentTabId].videoData;
            for (let videoQuality in currentVideoTabData) {
                selectElement.append(new Option(videoQuality + 'p', videoQuality));
            }
            selectElement.addEventListener('change', () => {
                let dataText = selectElement.value;
                if (dataText !== '') {
                    dataText = currentVideoTabData[dataText].download
                    buttonElement.disabled = false;
                    dataElement.textContent = dataText;
                } else {
                    dataElement.textContent = textContentDefault;
                }
            });
        }
    }
});


