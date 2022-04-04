/* eslint-disable @typescript-eslint/no-var-requires */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { use } from 'passport';
import { Strategy as AppleTokenStrategy } from 'passport-apple-verify-token';

@Injectable()
export class AppleStrategy {
  constructor(public readonly config: ConfigService) {
    this.init();
  }
  init() {
    use(
      new AppleTokenStrategy(
        {
          clientId: this.config.get<string>('apple.id'),
        },
        (token, appleId, done) => {
          const user = {
            id: appleId,
            email: token?.email,
          };
          done(null, user);
        },
      ),
    );
  }
}
