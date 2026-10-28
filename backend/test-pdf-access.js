require("dotenv").config();
const config = require("./config/environment");

async function testPDFAccess() {
  const testUrl = `${config.PUBLIC_URL}/pdf/Q-1763817450887`;

  console.log("🧪 Testing PDF accessibility...");
  console.log("URL:", testUrl);

  try {
    const response = await fetch(testUrl);
    console.log("Status:", response.status);
    console.log("Content-Type:", response.headers.get("content-type"));

    if (response.ok) {
      console.log("✅ PDF is accessible!");
    } else {
      console.log("❌ PDF access failed");
    }
  } catch (error) {
    console.log("❌ Test failed:", error.message);
  }
}

testPDFAccess();
