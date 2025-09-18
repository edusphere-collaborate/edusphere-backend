import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);
  private readonly fromEmail: string;

  constructor(private config: ConfigService) {
    this.fromEmail = this.config.get<string>('FROM_EMAIL') || 'no-reply@example.com';

    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST'),
      port: Number(this.config.get<string>('SMTP_PORT') || 587),
      secure: false,
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendMail(to: string, subject: string, html: string) {
    const info = await this.transporter.sendMail({
      from: this.fromEmail,
      to,
      subject,
      html,
    });

    this.logger.debug(`Mail sent: ${info.messageId}`);
    return info;
  }

  // Basic templates (you can replace with handlebars/mjml if you prefer)
  verificationEmailHtml(
    firstName: string,
    verificationCode: string,
    verificationLink: string,
    expiresInHours = 24,
  ) {
    return `
      <p>Hello ${firstName ?? 'User'},</p>
      <p>Welcome to EduSphere! Please verify your email address to complete your registration.</p>
      <p><strong>Verification Code:</strong> ${verificationCode}</p>
      <p>Or click this link: <a href="${verificationLink}">${verificationLink}</a></p>
      <p>This link expires in ${expiresInHours} hours.</p>
      <p>If you didn't create an account, please ignore this email.</p>
      <p>Best regards,<br/>The EduSphere Team</p>
    `;
  }

  resetPasswordEmailHtml(
    firstName: string,
    resetCode: string,
    resetLink: string,
    expiresInHours = 1,
  ) {
    return `
      <p>Hello ${firstName ?? 'User'},</p>
      <p>We received a request to reset your password for your EduSphere account.</p>
      <p><strong>Reset Code:</strong> ${resetCode}</p>
      <p>Or click this link: <a href="${resetLink}">${resetLink}</a></p>
      <p>This link expires in ${expiresInHours} hour(s).</p>
      <p>If you didn't request this, ignore this email.</p>
      <p>Best regards,<br/>The EduSphere Team</p>
    `;
  }

  passwordChangedNotificationHtml(
    firstName: string,
    changeDate: string,
    changeTime: string,
  ) {
    return `
      <p>Hello ${firstName ?? 'User'},</p>
      <p>Your password was successfully changed on ${changeDate} at ${changeTime}.</p>
      <p>If this wasn't you, contact support immediately.</p>
      <p>Best regards,<br/>The EduSphere Team</p>
    `;
  }
}
