import { useCallback } from 'react';

import { useConfig } from '@proton/components/hooks';
import browser from '@proton/pass/lib/globals/browser';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

export const useNavigateToUpgrade = () => {
    const { SSO_URL } = useConfig() as ProtonConfig & { SSO_URL: string };
    return useCallback(() => browser.tabs.create({ url: `${SSO_URL}/pass/upgrade` }).catch(noop), []);
};
