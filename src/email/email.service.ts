import { SendGridService } from '@anchan828/nest-sendgrid';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailsService {
  constructor(private readonly _sendGrid: SendGridService) {}

  async sendVerifiedEmail(email: string, code: string): Promise<void> {
    await this._sendGrid.send({
      to: email,
      from: 'QuangHD <quang.hd0102@gmail.com>',
      subject: 'Verified email code',
      html: `Your code to verified your email is <b>${code}</b>`,
    });
  }

  async sendForgotPasswordEmail(email: string, code: string): Promise<void> {
    await this._sendGrid.send({
      to: email,
      from: 'QuangHD <quang.hd0102@gmail.com>',
      subject: 'Forgot password email',
      html: `Your code to forgot the password is <b>${code}</b>`,
    });
  }
}
