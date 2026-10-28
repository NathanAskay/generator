const twilio = require("twilio");
const config = require("../config/environment");

class TwilioService {
  constructor() {
    this.client = twilio(config.TWILIO.ACCOUNT_SID, config.TWILIO.AUTH_TOKEN);
    this.from = config.TWILIO.WHATSAPP_FROM;
  }

  async sendMessage(to, body, mediaUrl = null) {
    try {
      const msg = {
        from: this.from,
        to: to,
        body: body,
      };
      if (mediaUrl) msg.mediaUrl = [mediaUrl];
      const result = await this.client.messages.create(msg);
      console.log(`✅ Message sent to ${to}, SID: ${result.sid}`);
      return result;
    } catch (error) {
      console.error("❌ Failed to send message:", error.message);
      throw error;
    }
  }
}

module.exports = new TwilioService();
