import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Auth, AuthUser } from '../../decorators';
import { UserService } from '../user/user.service';
import { User } from './../user/schemas/user.entity';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginPayloadDto,
  LoginSocialQueryDto,
  RefreshTokenDto,
  ResetPasswordDto,
  UserInfoDto,
  UserLoginDto,
  UserRegisterDto,
  VerifyEmailDto,
} from './dto';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    public readonly authService: AuthService,
    public readonly userService: UserService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login user with email and password return the access token',
  })
  @ApiOkResponse({
    type: LoginPayloadDto,
    description: 'User info with access token',
  })
  async userLogin(@Body() userLogin: UserLoginDto) {
    const user = await this.authService.validateUser(userLogin);
    if (user.isBanned) {
      throw new HttpException(
        {
          status: HttpStatus.UNAUTHORIZED,
          messageCode: 'auth.banned_user',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
    const { accessToken, refreshToken } = await this.authService.createToken(
      user,
    );
    return {
      accessToken,
      refreshToken,
      data: user,
      message: 'LOGIN_SUCCESS',
    };
  }

  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Register user with email and password return the access token',
  })
  @ApiOkResponse({
    type: LoginPayloadDto,
    description: 'User info with access token',
  })
  async userRegister(
    @Body() userRegisterDto: UserRegisterDto,
  ): Promise<LoginPayloadDto> {
    const existUser = await this.userService.findByUsernameOrEmail({
      email: userRegisterDto.email,
    });
    if (existUser) {
      throw new HttpException(
        {
          status: HttpStatus.UNAUTHORIZED,
          messageCode: 'auth.email_used',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const createdUser = await this.userService.createUser(userRegisterDto);
    const { accessToken, refreshToken } = await this.authService.createToken(
      createdUser,
    );
    await this.authService.sendVerifyEmail(createdUser.email);
    // Remove password field when return data to client
    createdUser.password = undefined;
    return {
      accessToken,
      refreshToken,
      data: createdUser,
      message: 'LOGIN_SUCCESS',
    };
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @Auth()
  @ApiOkResponse({ type: User, description: 'Current user info' })
  async getCurrentUser(@AuthUser() user): Promise<User> {
    return this.userService.findOne(user.id);
  }

  @Put('me')
  @HttpCode(HttpStatus.OK)
  @Auth()
  @ApiOkResponse({ type: User, description: 'Update user info' })
  async updateCurrentUser(
    @AuthUser() user,
    @Body() body: UserInfoDto,
  ): Promise<User> {
    return this.userService.updateOne(user.id, body);
  }

  @Post('/logout')
  @HttpCode(HttpStatus.OK)
  @Auth()
  @ApiOkResponse({ type: User, description: 'Logout user' })
  async logout(@AuthUser() user) {
    await this.authService.clearRefreshToken(user.id);
    return {
      message: 'Logout success',
      success: true,
    };
  }

  @Post('/resendVerifyEmail')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Resend verify email',
  })
  async resendVerifyEmail(@Body() body: ForgotPasswordDto) {
    await this.authService.sendVerifyEmail(body.email);
    return { message: 'Send email successfully' };
  }

  @Post('/verifyEmail')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Verify email by code',
  })
  async verifyEmail(@Body() body: VerifyEmailDto) {
    return this.authService.verifyEmail(body.email, body.code);
  }

  @Put('/me/changePassword')
  @HttpCode(HttpStatus.OK)
  @Auth()
  @ApiOkResponse({
    description: 'Change password for authenticated user',
  })
  changePassword(@AuthUser() user, @Body() body: ChangePasswordDto) {
    return this.authService.changePassword(user.id, body);
  }

  @Post('/forgotPassword')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Send email forget password for particular email',
  })
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('/resetPassword')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Reset password for particular email',
  })
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(
      body.email,
      body.code,
      body.newPassword,
    );
  }

  @Post('/refreshToken')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Refresh the access token use refresh token',
  })
  refreshToken(@Body() body: RefreshTokenDto) {
    return this.authService.refreshToken(body.refreshToken);
  }

  @UseGuards(AuthGuard('facebook-token'))
  @Post('/facebook')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Login facebook api',
  })
  async facebookLogin(@Req() req, @Query() _: LoginSocialQueryDto) {
    const facebookProfile = req.user;
    // Case facebook user has email
    let userData = null;
    if (facebookProfile?.email) {
      const existUser = await this.userService.findByUsernameOrEmail({
        email: facebookProfile?.email,
      });
      // If have user exist with the facebook email return the registered user
      if (existUser) {
        userData = existUser;
      } else {
        const body = {
          facebookId: facebookProfile.id,
          firstName: facebookProfile.firstName,
          lastName: facebookProfile.lastName,
          email: facebookProfile.email,
          avatar: facebookProfile.avatar,
          isVerifiedEmail: true,
          password: facebookProfile.id,
        };
        userData = await this.userService.createUser(body);
      }
    } else {
      const existUserFacebookId = await this.userService.findOneBy({
        facebookId: facebookProfile?.id,
      });
      if (existUserFacebookId) {
        userData = existUserFacebookId;
      } else {
        const userDataNoEmail = {
          facebookId: facebookProfile.id,
          firstName: facebookProfile.firstName,
          lastName: facebookProfile.lastName,
          avatar: facebookProfile.avatar,
          isVerifiedEmail: true,
          password: facebookProfile.id,
        };
        userData = await this.userService.createUser(userDataNoEmail);
      }
    }
    userData.password = undefined;
    if (userData.isBanned) {
      throw new HttpException(
        {
          status: HttpStatus.UNAUTHORIZED,
          messageCode: 'auth.banned_user',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
    const { accessToken, refreshToken } = await this.authService.createToken(
      userData,
    );
    return {
      accessToken,
      refreshToken,
      data: userData,
      message: 'LOGIN_SUCCESS',
    };
  }

  @UseGuards(AuthGuard('google-verify-token'))
  @Post('/google')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Login google api',
  })
  async googleLogin(@Req() req, @Query() _: LoginSocialQueryDto) {
    const googleProfile = req.user;
    const existUser = await this.userService.findByUsernameOrEmail({
      email: googleProfile?.email,
    });
    let userData = null;
    // If have user exist with the facebook email return the registered user
    if (existUser) {
      userData = existUser;
    } else {
      const body = {
        googleId: googleProfile.id,
        firstName: googleProfile.firstName,
        lastName: googleProfile.lastName,
        email: googleProfile.email,
        avatar: googleProfile.avatar,
        isVerifiedEmail: true,
        password: googleProfile.id,
      };
      userData = await this.userService.createUser(body);
    }
    if (userData.isBanned) {
      throw new HttpException(
        {
          status: HttpStatus.UNAUTHORIZED,
          messageCode: 'auth.banned_user',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
    userData.password = undefined;
    const { accessToken, refreshToken } = await this.authService.createToken(
      userData,
    );
    return {
      accessToken,
      refreshToken,
      data: userData,
      message: 'LOGIN_SUCCESS',
    };
  }

  @UseGuards(AuthGuard('apple-verify-token'))
  @Post('/apple')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Login google api',
  })
  async appleLogin(
    @Req() req,
    @Query() _: LoginSocialQueryDto,
    @Body() body: UserInfoDto,
  ) {
    const appleProfile = req.user;
    let userData = null;
    if (!appleProfile?.email) {
      userData = await this.userService.findOneBy({
        appleId: appleProfile?.id,
      });
      if (!userData) {
        throw new HttpException(
          {
            status: HttpStatus.UNAUTHORIZED,
            messageCode: 'auth.fail',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }
    } else {
      const existUser = await this.userService.findByUsernameOrEmail({
        email: appleProfile?.email,
      });
      // If have user exist with the facebook email return the registered user
      if (existUser) {
        userData = existUser;
      } else {
        const payload = {
          appleId: appleProfile.id,
          email: appleProfile.email,
          isVerifiedEmail: true,
          password: appleProfile.id,
          firstName: body.firstName,
          lastName: body.lastName,
        };
        userData = await this.userService.createUser(payload);
      }
    }
    if (userData.isBanned) {
      throw new HttpException(
        {
          status: HttpStatus.UNAUTHORIZED,
          messageCode: 'auth.banned_user',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
    userData.password = undefined;
    const { accessToken, refreshToken } = await this.authService.createToken(
      userData,
    );
    return {
      accessToken,
      refreshToken,
      data: userData,
      message: 'LOGIN_SUCCESS',
    };
  }
}
