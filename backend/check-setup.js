require("dotenv").config();
const config = require("./config/environment");

console.log("🔍 CHECKING YOUR CURRENT SETUP:\n");
console.log("=== ENVIRONMENT VARIABLES ===");
console.log("PUBLIC_URL:", process.env.PUBLIC_URL || "❌ NOT SET");
console.log(
  "TWILIO_ACCOUNT_SID:",
  process.env.TWILIO_ACCOUNT_SID ? "✅ SET" : "❌ NOT SET"
);
console.log(
  "TWILIO_AUTH_TOKEN:",
  process.env.TWILIO_AUTH_TOKEN ? "✅ SET" : "❌ NOT SET"
);
console.log(
  "TWILIO_WHATSAPP_FROM:",
  process.env.TWILIO_WHATSAPP_FROM || "❌ NOT SET"
);
console.log("PORT:", process.env.PORT || "3000 (default)");

console.log("\n=== CONFIGURATION ===");
console.log("Public URL:", config.PUBLIC_URL);
console.log("Quote Directory:", config.QUOTE_DIR);

console.log("\n=== TWILIO WEBHOOK URL ===");
console.log("Expected Twilio Webhook:", config.PUBLIC_URL + "/webhook");

console.log("\n=== INSTRUCTIONS ===");
console.log('1. Copy the "Expected Twilio Webhook" URL above');
console.log("2. Paste it in Twilio Console → Messaging → WhatsApp Sandbox");
console.log("3. Make sure it matches EXACTLY");
