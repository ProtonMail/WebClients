import type { AuthSession } from '@proton/components/containers/login/interface';

import type { AppSwitcherState } from '../../public/AppSwitcherContainer';
import type { AuthExtensionState } from '../../public/AuthExtension';
import type { ReAuthState } from '../../public/ReAuthContainer';
import type { ProduceForkData, SSOType } from '../fork/interface';

type LoginLocationStateData<Type, State> = {
    type: Type;
    pathname: string;
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
    | LoginLocationStateData<'signup', null>
    | LoginLocationStateData<'sessions-switcher', null>
    | LoginLocationStateData<'reauth', ReAuthState>
    | LoginLocationStateData<'app-switcher', AppSwitcherState>
    | LoginLocationStateData<'auth-ext', AuthExtensionState>;

export interface LoginCompleteState {
    type: 'done';
    payload: {
        session: AuthSession;
        url: URL;
    };
}

export type LoginResult = LoginCompleteState | LoginLocationState;
