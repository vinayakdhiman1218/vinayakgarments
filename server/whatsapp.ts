
import twilio from 'twilio';
import { log } from './vite';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendWhatsAppOTP(to: string, code: string): Promise<boolean> {
  try {
    const message = await client.messages.create({
      body: `Your Vinayak Garments verification code is: ${code}. Valid for 30 minutes.`,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${to}`
    });
    
    log(`WhatsApp OTP sent: ${message.sid}`);
    return true;
  } catch (error) {
    console.error('WhatsApp sending failed:', error);
    // For development, return true and log the code
    log(`DEVELOPMENT MODE: WhatsApp verification code for ${to} is: ${code}`);
    return process.env.NODE_ENV === 'development';
  }
}
