import type createApi from '@proton/shared/lib/api/createApi';
import type { AuthenticationStore } from '@proton/shared/lib/authentication/createAuthenticationStore';
import { listenFreeTrialSessionExpiration } from '@proton/shared/lib/desktop/endOfTrialHelpers';
import {
    BASELINE_ALLOWED_CONTENT_PROTOCOLS,
    BASELINE_ALLOWED_PROTOCOLS,
} from '@proton/shared/lib/desktop/externalProtocols';
import { registerInboxDesktopAuthListener } from '@proton/shared/lib/desktop/registerInboxDesktopAuthListener';
import {
    registerInboxDesktopIpcProtocols,
    registerInboxDesktopRedirectProtocols,
} from '@proton/shared/lib/desktop/registerInboxDesktopProtocols';
import { registerInboxDesktopUrlRules } from '@proton/shared/lib/desktop/registerInboxDesktopUrlRules';
import { URL_RULES } from '@proton/shared/lib/desktop/urls/rules';
import type { ProtonConfig } from '@proton/shared/lib/interfaces/config';
import { initElectronClassnames } from '@proton/theme/initElectronClassnames';

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

    registerInboxDesktopAuthListener(authentication);

    registerInboxDesktopIpcProtocols(BASELINE_ALLOWED_PROTOCOLS);
    registerInboxDesktopRedirectProtocols(BASELINE_ALLOWED_CONTENT_PROTOCOLS);

    registerInboxDesktopUrlRules(URL_RULES);
}
