import type createApi from '@proton/shared/lib/api/createApi';
import type { AuthenticationStore } from '@proton/shared/lib/authentication/createAuthenticationStore';
import { listenFreeTrialSessionExpiration } from '@proton/shared/lib/desktop/endOfTrialHelpers';
import {
    BASELINE_ALLOWED_CONTENT_PROTOCOLS,
    BASELINE_ALLOWED_PROTOCOLS,
} from '@proton/shared/lib/desktop/externalProtocols';
import { handleInboxDesktopIPCPostMessages } from '@proton/shared/lib/desktop/ipcHelpers';
import { registerInboxDesktopAuthListener } from '@proton/shared/lib/desktop/registerInboxDesktopAuthListener';
import {
    registerInboxDesktopIpcProtocols,
    registerInboxDesktopRedirectProtocols,
} from '@proton/shared/lib/desktop/registerInboxDesktopProtocols';
import { registerInboxDesktopUrlRules } from '@proton/shared/lib/desktop/registerInboxDesktopUrlRules';
import { URL_RULES } from '@proton/shared/lib/desktop/urls/rules';
import { getIsIframe } from '@proton/shared/lib/helpers/browser';
import type { ProtonConfig } from '@proton/shared/lib/interfaces/config';
import { initElectronClassnames } from '@proton/theme/initElectronClassnames';

export function bootstrapMailInboxDesktop({
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

    // Required for sidebar-calendar iframe
    if (!getIsIframe()) {
        handleInboxDesktopIPCPostMessages();

        registerInboxDesktopAuthListener(authentication);

        registerInboxDesktopIpcProtocols(BASELINE_ALLOWED_PROTOCOLS);
        registerInboxDesktopRedirectProtocols(BASELINE_ALLOWED_CONTENT_PROTOCOLS);
        registerInboxDesktopUrlRules(URL_RULES);
    }
}
