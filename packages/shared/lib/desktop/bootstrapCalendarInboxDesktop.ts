import type { createAuthentication } from '@proton/account/bootstrap';

import type createApi from '../api/createApi';
import { getIsIframe } from '../helpers/browser';
import { initElectronClassnames } from '../helpers/initElectronClassnames';
import type { ProtonConfig } from '../interfaces';
import { listenFreeTrialSessionExpiration } from './endOfTrialHelpers';
import { handleInboxDesktopIPCPostMessages } from './ipcHelpers';

export function bootstrapCalendarInboxDesktop({
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

    if (!getIsIframe()) {
        handleInboxDesktopIPCPostMessages();
    }
}
