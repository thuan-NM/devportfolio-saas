import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { Profile } from 'passport-github2';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID') || '',
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET') || '',
      callbackURL: configService.get<string>('GITHUB_CALLBACK_URL') || 'http://localhost:3001/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: Error | null, user?: any) => void,
  ): Promise<void> {
    try {
      const { id, username, displayName, emails, photos } = profile;

      const email = emails && emails.length > 0 ? emails[0].value : null;
      const avatarUrl = photos && photos.length > 0 ? photos[0].value : null;

      if (!email) {
        done(new Error('No email found in GitHub profile'), undefined);
        return;
      }

      console.log('🔑 GitHub Access Token:', accessToken);

      const user = await this.authService.validateOAuthUser({
        githubId: id,
        email,
        username: username || `github_${id}`,
        firstName: displayName?.split(' ')[0] || 'GitHub',
        lastName: displayName?.split(' ').slice(1).join(' ') || 'User',
        avatarUrl: avatarUrl ?? undefined,
        githubAccessToken: accessToken,
      });

      done(null, user);
    } catch (error) {
      done(error as Error, undefined);
    }
  }
}
