import type { Action, ThunkDispatch, TypedStartListening } from '@reduxjs/toolkit';
import type { History } from 'history';

import type { EventLoop } from '@proton/account/eventLoop';
import type { ApiWithListener } from '@proton/shared/lib/api/createApi';
import type { AuthenticationStore } from '@proton/shared/lib/authentication/createAuthenticationStore';
import type { EventManager } from '@proton/shared/lib/eventManager/eventManager';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';
import type { UnleashClient } from '@proton/unleash';

export interface ProtonThunkArguments {
    api: ApiWithListener;
    eventManager: EventManager<EventLoop>;
    history: History;
    unleashClient: UnleashClient;
    authentication: AuthenticationStore;
    config: ProtonConfig;
}

export type ProtonDispatch<T> = ThunkDispatch<T, ProtonThunkArguments, Action>;

export type SharedStartListening<RequiredState> = TypedStartListening<
    RequiredState,
    ProtonDispatch<any>,
    ProtonThunkArguments
>;
