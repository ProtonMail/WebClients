import type { createAuthentication } from '@proton/account/bootstrap';

import type createApi from '../api/createApi';
import { initElectronClassnames } from '../helpers/initElectronClassnames';
import type { ProtonConfig } from '../interfaces';
import { listenFreeTrialSessionExpiration } from './endOfTrialHelpers';

export function bootstrapMailInboxDesktop({
    config,
    authentication,
    api,
}: {
    config: ProtonConfig;
    authentication: ReturnType<typeof createAuthentication>;
    api: ReturnType<typeof createApi>;
}) {
    initElectronClassnames();
    listenFreeTrialSessionExpiration(config.APP_NAME, authentication, api);
}
