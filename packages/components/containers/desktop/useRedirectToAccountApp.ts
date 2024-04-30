import { useCallback } from 'react';

import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';

import { openLinkInBrowser } from './openExternalLink';
import { useHasInboxDesktopInAppPayments } from './useHasInboxDesktopInAppPayments';

export function useRedirectToAccountApp() {
    const hasInboxDesktopInAppPayments = useHasInboxDesktopInAppPayments();

    return useCallback(() => {
        if (isElectronApp && !hasInboxDesktopInAppPayments) {
            openLinkInBrowser(getAppHref('/mail/dashboard', APPS.PROTONACCOUNT));
            return true;
        }

        return false;
    }, [hasInboxDesktopInAppPayments]);
}
