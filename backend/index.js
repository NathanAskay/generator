require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const config = require("./config/environment");
const conversationHandler = require("./handlers/conversation-handler");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

// Static file serving
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/logos", express.static(path.join(__dirname, "public", "logos")));

// Webhook endpoint for Twilio
app.post("/webhook", async (req, res) => {
  const from = req.body.From;
  const body = req.body.Body || "";
  const mediaUrl = req.body.MediaUrl0; // first media attachment

  // Respond immediately to Twilio
  res.set("Content-Type", "text/xml");
  res.status(200).send("<Response></Response>");

  // Process asynchronously
  try {
    await conversationHandler.handleMessage(from, body, mediaUrl);
  } catch (error) {
    console.error("Webhook error:", error);
  }
});

// Test endpoint to serve PDF directly (using the same route as in pdf-generator)
app.get("/pdf/:id", (req, res) => {
  const pdfPath = path.join(config.QUOTE_DIR, `${req.params.id}.pdf`);
  if (fs.existsSync(pdfPath)) {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${req.params.id}.pdf"`,
    );
    res.sendFile(pdfPath);
  } else {
    res.status(404).send("PDF not found");
  }
});

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "running",
    conversations: conversationHandler.conversations.size,
  });
});

// Start server
app.listen(config.PORT, () => {
  console.log(`🚀 Server running on ${config.PUBLIC_URL}`);
  setInterval(
    () => conversationHandler.cleanupStaleConversations(),
    10 * 60 * 1000,
  );
});
