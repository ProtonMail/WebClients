import { useContext } from 'react';

import ConfigContext from '@proton/components/containers/config/configContext';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';

export type PassConfig = ProtonConfig & { SSO_URL: string };

/** if SSO_URL is not defined in the application's config, it
 * will fallback to resolving the url based on the current host */
export const usePassConfig = (): PassConfig => {
    const config = useContext(ConfigContext) as PassConfig;
    return { ...config, SSO_URL: config.SSO_URL || getAppHref('/', APPS.PROTONACCOUNT) };
};
