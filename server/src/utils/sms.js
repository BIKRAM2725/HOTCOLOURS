// src/utils/sms.js
import Twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM;

let client = null;
if (accountSid && authToken) {
  client = Twilio(accountSid, authToken);
}

export async function sendSms({ to, body }) {
  if (!client) {
    console.warn("Twilio client not configured, skipping SMS to", to);
    return { success: false, error: "twilio-not-configured" };
  }

  try {
    const msg = await client.messages.create({
      from: fromNumber,
      to,
      body,
    });
    console.debug("SMS sent:", msg.sid);
    return { success: true, sid: msg.sid };
  } catch (err) {
    console.error("sendSms error:", err);
    return { success: false, error: err };
  }
}
