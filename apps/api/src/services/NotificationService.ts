import twilio from 'twilio';

export const sendEmergencyNotification = async (contact: string, location: { lat: number, lng: number }) => {
  try {
    const message = `EMERGENCY SOS! User is at: https://www.google.com/maps?q=${location.lat},${location.lng}`;
    
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      console.warn('[NotificationService] Twilio credentials not found in .env. Mocking response.');
      console.log(`[SOS MOCK] To: ${contact} | Message: ${message}`);
      return true;
    }

    const client = twilio(accountSid, authToken);

    // Twilio requires E.164 format (e.g., +917575024635)
    const formatNumber = (num: string) => num.startsWith('+') ? num : `+${num}`;
    
    const response = await client.messages.create({
      body: message,
      from: formatNumber(fromNumber),
      to: formatNumber(contact)
    });

    console.log('[NotificationService] Twilio Response SID:', response.sid);
    
    return !!response.sid;
  } catch (error) {
    console.error('[NotificationService] Twilio Error:', error);
    return false;
  }
};
