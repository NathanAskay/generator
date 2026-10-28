const twilio = require("twilio");
const config = require("../config/environment");

function validateTwilioRequest(req, res, next) {
  // TEMPORARY: Disable validation for development
  if (
    process.env.NODE_ENV === "development" ||
    process.env.DISABLE_TWILIO_AUTH === "true"
  ) {
    console.log("⚠️  Twilio validation disabled for development");
    return next();
  }

  try {
    const twilioSignature = req.headers["x-twilio-signature"];
    if (!twilioSignature) {
      console.warn("No Twilio signature found");
      return res.status(403).send("Invalid signature");
    }

    const url = config.PUBLIC_URL + req.originalUrl;
    const params = req.body;

    const isValid = twilio.validateRequest(
      config.TWILIO.AUTH_TOKEN,
      twilioSignature,
      url,
      params
    );

    if (!isValid) {
      console.warn("Invalid Twilio signature");
      return res.status(403).send("Invalid signature");
    }

    next();
  } catch (error) {
    console.error("Error validating Twilio request:", error);
    res.status(500).send("Authentication error");
  }
}

module.exports = { validateTwilioRequest };
