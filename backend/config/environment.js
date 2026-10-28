require("dotenv").config();
const path = require("path");

const config = {
  PORT: process.env.PORT || 3000,
  PUBLIC_URL:
    process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`,
  QUOTE_DIR:
    process.env.PDF_OUTPUT_DIR ||
    path.join(__dirname, "..", "public", "quotes"),
  LOGO_DIR:
    process.env.LOGO_OUTPUT_DIR ||
    path.join(__dirname, "..", "public", "logos"),

  // Twilio configuration
  TWILIO: {
    ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    WHATSAPP_FROM: process.env.TWILIO_WHATSAPP_FROM,
  },

  // Conversation timeout (30 minutes)
  CONVERSATION_TIMEOUT: 30 * 60 * 1000,

  // Development settings
  DISABLE_TWILIO_AUTH: process.env.DISABLE_TWILIO_AUTH || "true",
};

// Validate required environment variables
const requiredEnvVars = [
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_WHATSAPP_FROM",
];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error("❌ Missing required environment variables:", missingVars);
  console.log("💡 Please check your .env file");
}

module.exports = config;
