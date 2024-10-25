import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { requestFork } from '@proton/pass/lib/auth/fork';
import browser from '@proton/pass/lib/globals/browser';
import type { ForkType } from '@proton/shared/lib/authentication/fork/constants';
import { APPS, PASS_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { SSO_URL } from '../../app/config';
import { promptForPermissions } from '../utils/permissions';
import { usePermissionsGranted } from './usePermissionsGranted';

/* depending on where we execute this : we may or may not
 * have access to the tabs API - Firefox content-scripts have
 * very limited support for the tabs API */
export const useRequestFork = () => async (forkType?: ForkType, replace?: boolean) => {
    const { url } = requestFork({ host: SSO_URL, forkType, app: APPS.PROTONPASSBROWSEREXTENSION });

    if (replace) return window.location.replace(url);
    return browser.tabs ? browser.tabs.create({ url }).catch(noop) : window.open(url, '_BLANK');
};

/* before navigating to login we should prompt the
 * user for any extension permissions required for PASS
 * to work correctly. IE: on FF we absolutely need the user
 * to do so for fallback account communication to work  */
export const useRequestForkWithPermissions = (options?: { autoClose?: boolean; replace?: boolean }) => {
    const { createNotification } = useNotifications();
    const accountFork = useRequestFork();
    const permissionsGranted = usePermissionsGranted();

    return async (forkType?: ForkType) => {
        if (permissionsGranted || (await promptForPermissions())) {
            return accountFork(forkType, options?.replace).finally(async () => {
                if (options?.autoClose) window.close();
            });
        }

        createNotification({
            type: 'error',
            text: c('Error').t`Please grant ${PASS_APP_NAME} the necessary extension permissions in order to continue`,
            expiration: -1,
        });
    };
};
