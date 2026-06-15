import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private initialized = false;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const projectId = this.configService.get('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get('FIREBASE_CLIENT_EMAIL');
    let privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');
    if (privateKey) {
      privateKey = privateKey.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
    }

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      this.initialized = true;
      this.logger.log('Firebase Admin initialized successfully.');
    } else {
      this.logger.warn('Firebase credentials missing. Notifications will not be sent.');
    }
  }

  async sendPushNotification(token: string, title: string, body: string, data?: any) {
    if (!this.initialized) return;

    try {
      const message = {
        notification: { title, body },
        token: token,
        data: data || {},
      };

      await admin.messaging().send(message);
    } catch (error) {
      this.logger.error('Error sending FCM notification:', error);
    }
  }
}
