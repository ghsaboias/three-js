const BACKEND_URL = "http://localhost:3001";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("globe-canvas").appendChild(renderer.domElement);

const geometry = new THREE.SphereGeometry(5, 64, 64);
const loader = new THREE.TextureLoader();
const texture = loader.load(
  "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
);
const material = new THREE.MeshPhongMaterial({ map: texture });
const earth = new THREE.Mesh(geometry, material);
scene.add(earth);

scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(50, 50, 50);
scene.add(pointLight);

camera.position.z = 15;

function latLonToVector3(lat, lon) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(5.1 * Math.sin(phi) * Math.cos(theta));
  const z = 5.1 * Math.sin(phi) * Math.sin(theta);
  const y = 5.1 * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

async function askClaude(article) {
  const prompt = `
    Analyze the following news article and determine the most relevant geographical location (city and country) it pertains to. If multiple locations are mentioned, choose the most significant one. If no specific location is mentioned, suggest the most likely location based on the content. Then, provide the latitude and longitude coordinates for this location.

    Article Title: ${article.title}
    Article Description: ${article.description}
    
    Respond exactly in the following format:
    Location: [City], [Country]
    Latitude: [Latitude]
    Longitude: [Longitude]
    Reasoning: [Brief explanation of your choice]
  `;

  try {
    const response = await fetch(`${BACKEND_URL}/ask-claude`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: prompt }),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    return data.content?.[0]?.text || null;
  } catch (error) {
    console.error("Error calling Claude API:", error);
    log(`Error calling Claude API: ${error.message}`);
    return null;
  }
}

async function addNewsMarkers(newsData) {
  const newsAmount = parseInt(document.getElementById("newsAmount").value);
  const selectedNews = newsData.slice(0, newsAmount);
  earth.children = [];
  let addedMarkers = 0;

  for (const news of selectedNews) {
    if (isFetchPaused) {
      log("Paused: Stopped processing news items.");
      break;
    }

    const claudeResponse = await askClaude(news);
    if (claudeResponse) {
      try {
        const lines = claudeResponse.split("\n");
        const location = lines
          .find((line) => line.startsWith("Location:"))
          ?.split(":")[1]
          .trim();
        const lat = parseFloat(
          lines.find((line) => line.startsWith("Latitude:"))?.split(":")[1]
        );
        const lon = parseFloat(
          lines.find((line) => line.startsWith("Longitude:"))?.split(":")[1]
        );

        if (location && !isNaN(lat) && !isNaN(lon)) {
          const markerGeometry = new THREE.SphereGeometry(0.07, 32, 32);
          const defaultColor = 0xff0000;
          const markerMaterial = new THREE.MeshBasicMaterial({
            color: defaultColor,
          });
          const marker = new THREE.Mesh(markerGeometry, markerMaterial);
          const position = latLonToVector3(lat, lon);
          marker.position.set(position.x, position.y, position.z);
          marker.userData.defaultColor = defaultColor;

          const hitGeometry = new THREE.SphereGeometry(0.4, 32, 32);
          const hitMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.0,
          });
          const hitSphere = new THREE.Mesh(hitGeometry, hitMaterial);
          hitSphere.position.copy(marker.position);
          hitSphere.position.y += 0.7;

          const markerGroup = new THREE.Group();
          markerGroup.add(marker);
          markerGroup.add(hitSphere);
          markerGroup.userData = {
            title: news.title,
            url: news.url,
            source: news.source.name,
            location: location,
          };

          earth.add(markerGroup);
          addedMarkers++;
          log(
            `Added marker for article: "${news.title}" at ${location} (${lat}, ${lon})`
          );
        }
      } catch (error) {
        log(
          `Error processing location for article: "${news.title}". Error: ${error.message}`
        );
      }
    } else {
      log(`Failed to get location for article: "${news.title}"`);
    }
  }
  log(`Added ${addedMarkers} news markers to the globe.`);
}

function log(message) {
  const logElement = document.getElementById("log");
  logElement.innerHTML += `${new Date().toISOString()}: ${message}<br>`;
  logElement.scrollTop = logElement.scrollHeight;
  console.log(message);
}

let isFetchPaused = false;
let fetchInterval;
const pauseFetchButton = document.getElementById("pauseFetchButton");

function toggleFetchPause() {
  isFetchPaused = !isFetchPaused;
  pauseFetchButton.textContent = isFetchPaused ? "Resume Fetch" : "Pause Fetch";
  pauseFetchButton.classList.toggle("paused", isFetchPaused);

  if (isFetchPaused) {
    clearInterval(fetchInterval);
    log("News fetching and Claude API calls paused");
  } else {
    startFetchInterval();
    log("News fetching and Claude API calls resumed");
  }
}

pauseFetchButton.addEventListener("click", toggleFetchPause);

async function fetchNews() {
  if (isFetchPaused) {
    log("News fetching is paused. Click 'Resume Fetch' to continue.");
    return;
  }

  const newsSource = document.getElementById("newsSource").value;
  let params = new URLSearchParams();

  if (newsSource === "top-headlines") {
    params.append("endpoint", "top-headlines");
    params.append("category", document.getElementById("category").value);
    params.append("country", document.getElementById("country").value);
  } else {
    params.append("endpoint", "everything");
    params.append("sources", document.getElementById("source").value);
  }

  const url = `${BACKEND_URL}/api/news?${params.toString()}`;
  log(`Fetching news from URL: ${url}`);

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    log(`JSON parsed successfully. Received ${data.articles.length} articles.`);

    await addNewsMarkers(data.articles);
  } catch (error) {
    log(`Error fetching news: ${error.name}: ${error.message}`);
    console.error("Full error object:", error);
  }
}

document.getElementById("newsSource").addEventListener("change", function () {
  document.getElementById("category").style.display =
    this.value === "top-headlines" ? "inline" : "none";
  document.getElementById("country").style.display =
    this.value === "top-headlines" ? "inline" : "none";
  document.getElementById("source").style.display =
    this.value === "top-headlines" ? "none" : "inline";
});

document.getElementById("fetchButton").addEventListener("click", fetchNews);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}
window.addEventListener("mousemove", onMouseMove, false);

function hideInfoBox() {
  document.getElementById("info").style.display = "none";
}

let isPaused = false;
const pauseButton = document.getElementById("pauseButton");
const animationSlider = document.getElementById("animationSlider");
const sliderValue = document.getElementById("sliderValue");
let lastSliderValue = 0;
let selectedMarker = null;

pauseButton.addEventListener("click", () => {
  isPaused = !isPaused;
  pauseButton.textContent = isPaused ? "Resume rotation" : "Pause rotation";
});

animationSlider.addEventListener("input", () => {
  earth.rotation.y = (animationSlider.value * Math.PI) / 180;
  sliderValue.textContent = `${animationSlider.value}°`;
});

function onClick(event) {
  const infoBox = document.getElementById("info");
  if (infoBox.contains(event.target)) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(earth.children, true);

  if (intersects.length > 0) {
    let markerGroup = intersects[0].object;
    while (markerGroup && !(markerGroup instanceof THREE.Group)) {
      markerGroup = markerGroup.parent;
    }

    if (markerGroup && markerGroup.userData && markerGroup.userData.title) {
      selectedMarker = markerGroup;
      updateInfoBox(markerGroup.userData);
    } else {
      selectedMarker = null;
      hideInfoBox();
    }
  } else {
    selectedMarker = null;
    hideInfoBox();
  }
}

function updateInfoBox(newsData) {
  const infoBox = document.getElementById("info");

  if (!newsData) {
    infoBox.style.display = "none";
    return;
  }

  infoBox.innerHTML = `
    <strong>${newsData.title || "No title"}</strong><br>
    Location: ${newsData.location || "Unknown"}<br>
    Source: ${newsData.source || "Unknown"}<br>
    <a href="${
      newsData.url || "#"
    }" target="_blank" id="readMoreLink">Read more</a>
  `;
  infoBox.style.display = "block";

  document
    .getElementById("readMoreLink")
    .addEventListener("click", function (event) {
      event.stopPropagation();
    });
}

function animate() {
  requestAnimationFrame(animate);

  if (!isPaused) {
    earth.rotation.y += 0.002;
    animationSlider.value = ((earth.rotation.y * 180) / Math.PI) % 360;
    sliderValue.textContent = `${Math.round(animationSlider.value)}°`;
  } else {
    const currentSliderValue = parseInt(animationSlider.value);
    if (currentSliderValue !== lastSliderValue) {
      earth.rotation.y = (currentSliderValue * Math.PI) / 180;
      lastSliderValue = currentSliderValue;
    }
  }

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(earth.children, true);

  handleMarkerHover(intersects);

  let hoveredMarkerGroup = intersects.find((intersect) => {
    let obj = intersect.object;
    while (obj && !(obj instanceof THREE.Group)) {
      obj = obj.parent;
    }
    return obj && obj.userData && obj.userData.title;
  })?.object;

  document.body.style.cursor = hoveredMarkerGroup ? "pointer" : "default";

  if (selectedMarker) {
    updateInfoBox(selectedMarker.userData);
  }

  renderer.render(scene, camera);
}

const canvas = renderer.domElement;
canvas.addEventListener("mousemove", onMouseMove, false);
canvas.addEventListener("click", onClick, false);

animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function startFetchInterval() {
  clearInterval(fetchInterval);
  fetchNews();
  fetchInterval = setInterval(() => {
    if (!isFetchPaused) {
      fetchNews();
    }
  }, 5 * 60 * 1000);
}

function handleMarkerHover(intersects) {
  const hoverColor = 0xffff00;

  earth.children.forEach((markerGroup) => {
    if (markerGroup instanceof THREE.Group) {
      const marker = markerGroup.children.find(
        (child) =>
          child.geometry instanceof THREE.SphereGeometry &&
          child.material.opacity !== 0
      );
      if (marker) {
        const isHovered = intersects.some(
          (intersect) => intersect.object.parent === markerGroup
        );
        marker.material.color.setHex(
          isHovered ? hoverColor : marker.userData.defaultColor
        );
      }
    }
  });
}
