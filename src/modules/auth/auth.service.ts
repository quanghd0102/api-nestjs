/* eslint-disable @typescript-eslint/tslint/config */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import bcrypt from 'bcryptjs';

import { EmailsService } from '../../email/email.service';
import { IModel } from '../../interfaces';
import { UtilsService } from '../../providers/utils.service';
import { User } from '../user/schemas/user.entity';
import { UserService } from '../user/user.service';
import { ChangePasswordDto, UserLoginDto } from './dto';
import { Token, TokenDocument } from './schemas/token.entity';

@Injectable()
export class AuthService {
  constructor(
    public readonly jwtService: JwtService,
    public readonly configService: ConfigService,
    public readonly userService: UserService,
    public readonly emailService: EmailsService,
    @InjectModel(Token.name) private _tokenModel: IModel<TokenDocument>,
  ) {}

  async createToken(data) {
    // eslint-disable-next-line @typescript-eslint/tslint/config
    const { _id, role, email, firstName, lastName } = data;
    const refreshToken = UtilsService.generateRandomString(24);
    await this._tokenModel.create({
      token: refreshToken,
      userId: _id,
    });
    return {
      refreshToken,
      accessToken: this.jwtService.sign({
        _id,
        email,
        role,
        firstName,
        lastName,
        id: _id,
      }),
    };
  }

  async refreshToken(refreshToken: string) {
    // eslint-disable-next-line @typescript-eslint/tslint/config
    const token = await this._tokenModel.findOne({
      token: refreshToken,
    });
    if (!token) {
      throw new HttpException(
        {
          status: HttpStatus.UNAUTHORIZED,
          messageCode: 'auth.invalid_refresh_token',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
    const user = await this.userService.findOne(token.userId);
    if (!user) {
      throw new HttpException(
        {
          status: HttpStatus.UNAUTHORIZED,
          messageCode: 'auth.invalid_user',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (user.isBanned) {
      throw new HttpException(
        {
          status: HttpStatus.UNAUTHORIZED,
          messageCode: 'auth.banned_user',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
    const { _id, role, email, firstName, lastName } = user;
    return {
      data: user,
      refreshToken,
      accessToken: this.jwtService.sign({
        _id,
        email,
        role,
        firstName,
        lastName,
        id: _id,
      }),
    };
  }

  async clearRefreshToken(userId: string) {
    await this._tokenModel.deleteMany({
      userId,
    });
  }

  async validateUser(userLoginDto: UserLoginDto): Promise<User> {
    const user = await this.userService.findByUsernameOrEmail({
      email: userLoginDto.email,
    });
    if (user?.loginAttemptCount === 5) {
      throw new HttpException(
        {
          status: HttpStatus.UNAUTHORIZED,
          messageCode: 'auth.password_many_incorrect',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
    const isPasswordValid = await UtilsService.validateHash(
      userLoginDto.password,
      user && user.password,
    );
    if (!user || !isPasswordValid) {
      if (user?._id) {
        await this.userService.updateOne(user._id, {
          $inc: { loginAttemptCount: 1 },
        });
      }
      throw new HttpException(
        {
          status: HttpStatus.UNAUTHORIZED,
          messageCode: 'auth.email_pass_incorrect',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
    user.password = undefined;
    return user;
  }

  async changePassword(userId, body: ChangePasswordDto) {
    const user = await this.userService.findOneWithPassword(userId);
    const isPasswordValid = await UtilsService.validateHash(
      body.oldPassword,
      user && user.password,
    );
    if (!isPasswordValid) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          messageCode: 'auth.incorrect_password',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    const hashNewPassword = UtilsService.generateHash(body.newPassword);
    await this.userService.updateOne(userId, {
      password: hashNewPassword,
    });
    return { success: true };
  }

  async forgotPassword(email: string) {
    const user = await this.userService.findByUsernameOrEmail({ email });
    if (!user) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          messageCode: 'auth.email_not_found',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    const code = UtilsService.generateRandomString(6);
    // Set email expire date to 24 hour
    const expiryDate = new Date(
      new Date().setHours(new Date().getHours() + 24),
    );
    await this.userService.updateOne(user._id, {
      resetPasswordToken: code,
      resetPasswordExpire: expiryDate.toISOString(),
    });
    await this.emailService.sendForgotPasswordEmail(email, code);
    return { message: 'Reset password email has been sent' };
  }

  async sendVerifyEmail(email: string): Promise<void> {
    const code = UtilsService.generateRandomString(6);
    const user = await this.userService.findByUsernameOrEmail({ email });
    if (!user || user?.isVerifiedEmail) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          messageCode: 'auth.email_not_found',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    const expiryDate = new Date(
      new Date().setHours(new Date().getHours() + 24),
    );
    await this.userService.updateOne(user._id, {
      verifyEmailToken: code,
      verifyEmailExpire: expiryDate,
    });
    await this.emailService.sendVerifiedEmail(email, code);
  }

  async verifyEmail(email: string, code: string) {
    const user = await this.userService.findByUsernameOrEmail({ email });
    if (!user || user?.isVerifiedEmail) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          messageCode: 'auth.email_not_found',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      user.verifyEmailToken === code &&
      new Date().getTime() < new Date(user.verifyEmailExpire).getTime()
    ) {
      await this.userService.updateOne(user._id, {
        verifyEmailToken: null,
        verifyEmailExpire: null,
        isVerifiedEmail: true,
      });
      return {
        message: 'Verify email success',
      };
    }
    throw new HttpException(
      {
        status: HttpStatus.BAD_REQUEST,
        messageCode: 'auth.invalid_code',
      },
      HttpStatus.BAD_REQUEST,
    );
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await this.userService.findByUsernameOrEmail({ email });

    if (!user || !user?.resetPasswordToken) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          messageCode: 'auth.email_not_found',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      user.resetPasswordToken === code &&
      new Date().getTime() < new Date(user.resetPasswordExpire).getTime()
    ) {
      await this.userService.updateOne(user._id, {
        resetPasswordToken: null,
        resetPasswordExpire: null,
        password: bcrypt.hashSync(newPassword),
        loginAttemptCount: 0,
      });
      return {
        message: 'Reset password success',
      };
    }
    throw new HttpException(
      {
        status: HttpStatus.BAD_REQUEST,
        messageCode: 'auth.invalid_code',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
