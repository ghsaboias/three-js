const express = require("express");
const cors = require("cors");
const Anthropic = require("@anthropic-ai/sdk");
require("dotenv").config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
