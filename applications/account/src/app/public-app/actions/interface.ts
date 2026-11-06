import type { LocationDescriptor } from 'history';

import type { ForkCodeLocation } from '@proton/shared/lib/authentication/interface';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import type { AppSwitcherState } from '../appSwitcher/AppSwitcherContainer';
import type { AuthSession } from '../authSession';
import type { AuthDesktopState } from '../fork/AuthDesktop';
import type { AuthExtensionState } from '../fork/AuthExtension';
import type { OAuthPartnersCallbackState, OAuthPartnersInitiateState } from '../oauthPartners/oauthPartners';
import type { ReAuthState } from '../reAuth/reauthContainerState';
import type { ProduceForkData, SSOType } from './forkInterface';

type LoginLocationStateData<Type, State> = {
    type: Type;
    location: LocationDescriptor;
    payload: State;
};

export type LoginLocationState =
    | LoginLocationStateData<
          'oauth-consent',
          {
              data: Extract<ProduceForkData, { type: SSOType.OAuth }>;
              session: AuthSession;
          }
      >
    | LoginLocationStateData<
          'fork-redirect-consent',
          {
              session: AuthSession;
              redirectUrl: string;
          }
      >
    | LoginLocationStateData<
          'desktop-fork-consent',
          {
              session: AuthSession;
              app: APP_NAMES;
              childClientId: string;
              /** Where the device showing the code is; only the code flow has one. */
              location?: ForkCodeLocation;
          }
      >
    | LoginLocationStateData<'login', null>
    | LoginLocationStateData<'signup', null>
    | LoginLocationStateData<'sessions-switcher', null>
    | LoginLocationStateData<'oauth-partners', OAuthPartnersInitiateState | OAuthPartnersCallbackState>
    | LoginLocationStateData<'reauth', ReAuthState>
    | LoginLocationStateData<'app-switcher', AppSwitcherState>
    | LoginLocationStateData<'auth-ext', AuthExtensionState>
    | LoginLocationStateData<'auth-desktop', AuthDesktopState>;

interface LoginCompleteState {
    type: 'done';
    payload: {
        session?: AuthSession;
        url: URL;
    };
}

export type LoginResult = LoginCompleteState | LoginLocationState;
