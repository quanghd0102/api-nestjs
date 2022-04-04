import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { use } from 'passport';
import FacebookTokenStrategy from 'passport-facebook-token';

@Injectable()
export class FacebookStrategy {
  constructor(public readonly config: ConfigService) {
    this.init();
  }
  init() {
    use(
      new FacebookTokenStrategy(
        {
          clientID: this.config.get<string>('facebook.id'),
          clientSecret: this.config.get<string>('facebook.secret'),
        },
        (_1, _2, profile: any, done: any) => {
          const user = {
            id: profile.id,
            firstName: profile?._json?.first_name,
            lastName: profile?._json?.last_name,
            email: profile?._json?.email,
            avatar: profile?.photos?.[0]?.value,
          };
          return done(null, user);
        },
      ),
    );
  }
}
