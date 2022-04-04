import { forwardRef, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import { EmailsModule } from '../../email/email.module';
import { UsersModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Token, TokenSchema } from './schemas/token.entity';
// import { AppleStrategy } from './strategies/apple';
// import { FacebookStrategy } from './strategies/facebook';
// import { GoogleStrategy } from './strategies/google';
import { JwtStrategy } from './strategies/jwt';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => EmailsModule),
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: config.get<string | number>('jwt.expireTime'),
        },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }]),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    // FacebookStrategy,
    // GoogleStrategy,
    // AppleStrategy,
  ],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
