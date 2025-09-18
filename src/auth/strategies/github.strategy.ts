import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('GITHUB_CLIENT_ID')!,
      clientSecret: config.get<string>('GITHUB_CLIENT_SECRET')!,
      callbackURL: config.get<string>('GITHUB_CALLBACK_URL')!,
      scope: ['user:email'], // get both profile and verified email
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: any, user?: any) => void,
  ): Promise<any> {
    console.log('GitHub Profile:', profile);

    const emails = profile.emails?.[0]?.value || null;
    const photos = profile.photos?.[0]?.value || null;

    const user = {
      provider: 'github',
      providerId: profile.id,
      username: profile.username,
      email: emails,
      displayName: profile.displayName,
      picture: photos,
      accessToken,
    };

    done(null, user);
  }
}
