# NewsMap Globe

## Video Demo

[Watch NewsMap Globe Demo](./demo/newsmapv2.gif)

## Overview

NewsMap Globe is an interactive 3D visualization tool that displays global news on a rotating Earth model. It fetches news articles from various sources and categories, then uses AI to determine the most relevant geographical location for each article. These locations are then displayed as markers on a 3D globe, allowing users to explore news from around the world in an engaging and intuitive manner.

## Features

- Interactive 3D Earth model powered by Three.js
- Real-time news fetching from multiple sources and categories
- AI-powered geographical location determination for news articles
- Clickable news markers with article information and links
- Customizable news sources, categories, and countries
- Pause/resume globe rotation
- Manual rotation control with a slider
- Real-time logging of operations and errors

## Technologies Used

- HTML5 / CSS3
- JavaScript (ES6+)
- Three.js for 3D rendering
- NewsAPI for fetching news data
- Claude AI for location determination

## Setup and Installation

1. Clone the repository:

   ```
   git clone https://github.com/ghsaboias/three-js.git
   cd three-js
   ```

2. Set up the backend server:

   - Ensure you have Node.js installed on your system.
   - Navigate to the backend directory and install dependencies:
     ```
     cd backend
     npm install
     ```
   - Create a `.env` file in the backend directory and add your Claude AI API key:
     ```
     CLAUDE_API_KEY=your_api_key_here
     ```

3. Start the backend server:

   ```
   node server.js
   ```

4. Open the `index.html` file in a modern web browser.

## Usage

1. Select your preferred news source, category, and country from the dropdown menus.
2. Click the "Refresh News" button to fetch and display the latest news on the globe.
3. Hover over markers to see article information in the info box.
4. Click on "Read more" in the info box to open the full article in a new tab.
5. Use the pause button to stop the globe's rotation.
6. When paused, use the slider to manually rotate the globe and explore news from different regions.

## Customization

You can customize the following aspects of the NewsMap Globe:

- News sources: Edit the `source` dropdown in the HTML file.
- Categories: Modify the `category` dropdown options.
- Countries: Update the `country` dropdown to include or remove countries.
- Marker appearance: Adjust the `markerGeometry` and `markerMaterial` in the `addNewsMarkers` function.
- Globe texture: Replace the Earth texture URL in the `loader.load()` function.

## Troubleshooting

- If markers aren't appearing, check the console for error messages and ensure the backend server is running correctly.
- If the globe isn't rendering, make sure you're using a browser that supports WebGL.
- For any other issues, refer to the log at the bottom of the page for detailed error messages.

## Contributing

Contributions to NewsMap Globe are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Commit your changes with clear, descriptive commit messages.
4. Push your branch and submit a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
