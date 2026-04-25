import { Request, Response } from 'express';
import { prisma } from '../db.js';
import { emergencySchema } from '../schemas/emergency.js';
import { sendEmergencyNotification } from '../services/NotificationService.js';

export const sendSOS = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = emergencySchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({ error: validation.error.errors[0].message });
      return;
    }

    const { userId, lat, lng } = validation.data;

    // Check if userId is a valid number
    if (isNaN(userId)) {
      res.status(400).json({ error: 'Invalid User ID format.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { emergencyContact: true, email: true }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    if (!user.emergencyContact) {
      res.status(400).json({ error: 'Emergency contact not configured for this user.' });
      return;
    }

    // Send the notification
    const result = await sendEmergencyNotification(user.emergencyContact, { lat, lng });

    if (!result) {
      res.status(500).json({
        success: false,
        message: `Failed to send emergency notification to ${user.emergencyContact}. Check balance or API configuration.`,
        data: {
          contact: user.emergencyContact,
          sent: false
        }
      });
      return;
    }

    res.json({
      success: true,
      message: `Emergency notification successfully sent to ${user.emergencyContact}`,
      data: {
        contact: user.emergencyContact,
        sent: true
      }
    });
  } catch (error) {
    console.error('Error in EmergencyController:', error);
    res.status(500).json({ error: 'Failed to process SOS request. Please try again later.' });
  }
};
