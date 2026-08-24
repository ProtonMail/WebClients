import type createApi from '../api/createApi';
import type { AuthenticationStore } from '../authentication/createAuthenticationStore';
import { initElectronClassnames } from '../helpers/initElectronClassnames';
import type { ProtonConfig } from '../interfaces';
import { listenFreeTrialSessionExpiration } from './endOfTrialHelpers';
import { BASELINE_ALLOWED_CONTENT_PROTOCOLS, BASELINE_ALLOWED_PROTOCOLS } from './externalProtocols';
import { registerInboxDesktopAuthListener } from './registerInboxDesktopAuthListener';
import {
    registerInboxDesktopIpcProtocols,
    registerInboxDesktopRedirectProtocols,
} from './registerInboxDesktopProtocols';
import { registerInboxDesktopUrlRules } from './registerInboxDesktopUrlRules';
import { URL_RULES } from './urls/rules';

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
