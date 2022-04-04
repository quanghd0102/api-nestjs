/* eslint-disable @typescript-eslint/no-var-requires */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { use } from 'passport';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const GoogleTokenStrategy = require('passport-google-verify-token').Strategy;

@Injectable()
export class GoogleStrategy {
  constructor(public readonly config: ConfigService) {
    this.init();
  }
  init() {
    use(
      new GoogleTokenStrategy(
        {
          clientID: this.config.get<string>('google.id'),
        },
        (profile, googleId, done) => {
          const user = {
            id: googleId,
            firstName: profile?.family_name,
            lastName: profile?.given_name,
            email: profile?.email,
            avatar: profile?.picture,
          };
          done(null, user);
        },
      ),
    );
  }
}
