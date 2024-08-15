// Existing imports and global variables

let newsCount = 0;

// Existing code...

function fetchNewsData() {
    newsCount = 0;
    updateNewsCountDisplay();
    
    // Existing fetch logic
    // ...
    
    // After fetching and processing data
    .then(data => {
        data.forEach(newsItem => {
            addMarkerToGlobe(newsItem);
        });
        updateNewsCountDisplay();
    })
    .catch(error => {
        console.error('Error fetching news data:', error);
    });
}

function addMarkerToGlobe(newsItem) {
    try {
        // Existing marker addition code
        // ...
        
        if (markerAddedSuccessfully) {
            newsCount++;
            if (newsCount % 10 === 0) {
                updateNewsCountDisplay();
            }
        }
    } catch (error) {
        console.error('Error adding marker to globe:', error);
    }
}

function updateNewsCountDisplay() {
    try {
        const newsCountElement = document.getElementById('news-count');
        newsCountElement.textContent = `News Articles: ${newsCount}`;
    } catch (error) {
        console.error('Error updating news count display:', error);
    }
}

// Existing code...

// Call fetchNewsData() when the page loads or when needed
fetchNewsData();