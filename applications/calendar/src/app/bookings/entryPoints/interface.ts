import type { History } from 'history';

import type { ApiWithListener } from '@proton/shared/lib/api/createApi';
import type { AuthenticationStore } from '@proton/shared/lib/authentication/createAuthenticationStore';
import type { UnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';
import type UnleashClient from '@proton/unleash/UnleashClient';

import type { BookingsStore } from '../../store/bookingsStore';

export interface BookingGuestBootstrapResult {
    store: BookingsStore;
    unleashClient: UnleashClient;
    unauthenticatedApi: UnauthenticatedApi;
    authentication: AuthenticationStore;
    history: History;
}

export interface BookingAuthBootstrapResult {
    store: BookingsStore;
    api: ApiWithListener;
    unleashClient: UnleashClient;
    authentication: AuthenticationStore;
    history: History;
}
