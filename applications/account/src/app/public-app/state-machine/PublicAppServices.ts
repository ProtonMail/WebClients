import { createContext, useContext } from 'react';

import type { ApiWithListener } from '@proton/shared/lib/api/createApi';
import type { UnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';
import type { UnleashClient } from '@proton/unleash/UnleashClient';

/** What the public app's pages and machine run on; created once when the app starts. */
export interface PublicAppServices {
    api: ApiWithListener;
    unauthenticatedApi: UnauthenticatedApi;
    unleashClient: UnleashClient;
}

export const PublicAppServicesContext = createContext<PublicAppServices | null>(null);

export const usePublicAppServices = () => {
    const services = useContext(PublicAppServicesContext);
    if (!services) {
        throw new Error('The public app services are missing');
    }
    return services;
};
