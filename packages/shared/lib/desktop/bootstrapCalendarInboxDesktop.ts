import type { AuthenticationStore } from '@proton/shared/lib/authentication/createAuthenticationStore';

import type createApi from '../api/createApi';
import { initElectronClassnames } from '../helpers/initElectronClassnames';
import type { ProtonConfig } from '../interfaces';
import { listenFreeTrialSessionExpiration } from './endOfTrialHelpers';
import { BASELINE_ALLOWED_CONTENT_PROTOCOLS, BASELINE_ALLOWED_PROTOCOLS } from './externalProtocols';
import {
    registerInboxDesktopIpcProtocols,
    registerInboxDesktopRedirectProtocols,
} from './registerInboxDesktopProtocols';

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

    registerInboxDesktopIpcProtocols(BASELINE_ALLOWED_PROTOCOLS);
    registerInboxDesktopRedirectProtocols(BASELINE_ALLOWED_CONTENT_PROTOCOLS);
}
