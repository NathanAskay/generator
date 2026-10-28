const fs = require("fs");
const path = require("path");
const config = require("../config/environment");
const Company = require("../models/Company");

class LogoService {
  async handleLogoUpload(phoneNumber, mediaUrl) {
    try {
      console.log(`🖼️ Processing logo for ${phoneNumber}`);
      const ext = ".png"; // Could detect from media type
      const fileName = `logo-${phoneNumber.replace("+", "")}-${Date.now()}${ext}`;
      const filePath = path.join(config.LOGO_DIR, fileName);

      // In production, use Twilio's Media API to download the image
      // For demo, we create a placeholder SVG
      this.createPlaceholderLogo(filePath);

      const logoUrl = `${config.PUBLIC_URL}/logos/${fileName}`;
      const updated = Company.updateLogo(phoneNumber, logoUrl);
      if (updated) {
        return { success: true, logoUrl, company: updated };
      } else {
        throw new Error("Company not found");
      }
    } catch (error) {
      console.error("Logo upload failed:", error);
      return { success: false, error: error.message };
    }
  }

  createPlaceholderLogo(filePath) {
    // Simple SVG placeholder – in production, download actual image
    const svg = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#3d3c9d"/>
      <text x="100" y="110" text-anchor="middle" fill="white" font-size="20">LOGO</text>
    </svg>`;
    fs.writeFileSync(filePath, svg);
  }
}

module.exports = new LogoService();
