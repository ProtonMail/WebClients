import { useCallback } from 'react';

import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import browser from '@proton/pass/lib/globals/browser';
import noop from '@proton/utils/noop';

export const useNavigateToUpgrade = () => {
    const { SSO_URL } = usePassConfig();
    return useCallback(() => browser.tabs.create({ url: `${SSO_URL}/pass/upgrade` }).catch(noop), []);
};
