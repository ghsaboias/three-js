const express = require("express");
const cors = require("cors");
const Anthropic = require("@anthropic-ai/sdk");
const axios = require("axios");
require("dotenv").config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const NEWS_API_KEY = process.env.NEWSAPI_API_KEY;
const NEWS_API_BASE_URL = "https://newsapi.org/v2/";

app.post("/ask-claude", async (req, res) => {
  console.log("Received request to /ask-claude");
  try {
    console.log("Sending request to Claude API");
    const completion = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 300,
      messages: [{ role: "user", content: req.body.prompt }],
    });

    console.log("Received response from Claude API");
    res.json(completion);
  } catch (error) {
    console.error("Error calling Claude API:", error.message);
    console.error("Full error object:", error);
    res.status(500).json({
      error: "Failed to get response from Claude",
      details: error.message,
    });
  }
});

app.get("/api/news", async (req, res) => {
  console.log("Received request to /api/news with query:", req.query);
  const { endpoint, category, country, sources } = req.query;

  let url;
  if (endpoint === "top-headlines") {
    url = `${NEWS_API_BASE_URL}top-headlines?category=${category}&country=${country}&apiKey=${NEWS_API_KEY}`;
  } else if (endpoint === "everything") {
    url = `${NEWS_API_BASE_URL}everything?sources=${sources}&apiKey=${NEWS_API_KEY}`;
  } else {
    console.error("Invalid endpoint specified:", endpoint);
    return res.status(400).json({ error: "Invalid endpoint specified" });
  }

  try {
    console.log(`Sending request to News API: ${url}`);
    const response = await axios.get(url);
    console.log(
      "Received response from News API:",
      response.status,
      response.statusText
    );
    res.json(response.data);
  } catch (error) {
    console.error("Error calling News API:", error.message);
    if (error.response) {
      console.error("News API response status:", error.response.status);
      console.error("News API response data:", error.response.data);
    }
    res.status(500).json({
      error: "Failed to get response from News API",
      details: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
