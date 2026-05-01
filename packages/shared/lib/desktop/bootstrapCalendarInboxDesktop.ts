import type { AuthenticationStore } from '@proton/shared/lib/authentication/createAuthenticationStore';

import type createApi from '../api/createApi';
import { initElectronClassnames } from '../helpers/initElectronClassnames';
import type { ProtonConfig } from '../interfaces';
import { listenFreeTrialSessionExpiration } from './endOfTrialHelpers';

export function bootstrapCalendarInboxDesktop({
    config,
    authentication,
    api,
}: {
    config: ProtonConfig;
    authentication: AuthenticationStore;
    api: ReturnType<typeof createApi>;
}) {
    initElectronClassnames();
    listenFreeTrialSessionExpiration(config.APP_NAME, authentication, api);
}
