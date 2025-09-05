import type { LocationDescriptor } from 'history';

import type { AuthSession } from '@proton/components/containers/login/interface';

import type { AppSwitcherState } from '../../public/AppSwitcherContainer';
import type { AuthDesktopState } from '../../public/AuthDesktop';
import type { AuthExtensionState } from '../../public/AuthExtension';
import type { OAuthPartnersCallbackState, OAuthPartnersInitiateState } from '../../public/OAuthPartnersContainer';
import type { ReAuthState } from '../../public/ReAuthContainer';
import type { ProduceForkData, SSOType } from './forkInterface';

type LoginLocationStateData<Type, State> = {
    type: Type;
    location: LocationDescriptor;
    payload: State;
};

export type LoginLocationState =
    | LoginLocationStateData<
          'confirm-oauth',
          {
              data: Extract<ProduceForkData, { type: SSOType.OAuth }>;
              session: AuthSession;
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

export interface LoginCompleteState {
    type: 'done';
    payload: {
        session?: AuthSession;
        url: URL;
    };
}

export type LoginResult = LoginCompleteState | LoginLocationState;
