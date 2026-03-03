import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import type { ProtonConfig } from '@proton/shared/lib/interfaces/config';

export function isInApp(protonConfig: ProtonConfig, app: APP_NAMES, parentApp: APP_NAMES | undefined) {
    return protonConfig.APP_NAME === app || (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === app);
}
