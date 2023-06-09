import { c } from 'ttag';

import { useNotifications } from '@proton/components/hooks';
import { requestFork } from '@proton/pass/auth';
import browser from '@proton/pass/globals/browser';
import type { FORK_TYPE } from '@proton/shared/lib/authentication/ForkInterface';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { SSO_URL } from '../../app/config';
import { promptForPermissions } from '../extension/permissions';
import { usePermissionsGranted } from './usePermissionsGranted';

/* depending on where we execute this : we may or may not
 * have access to the tabs API - Firefox content-scripts have
 * very limited support for the tabs API */
export const useAccountFork = () => async (type: FORK_TYPE) => {
    const url = await requestFork(SSO_URL, type);
    return browser.tabs ? browser.tabs.create({ url }) : window.open(url, '_BLANK');
};

/* before navigating to login we should prompt the
 * user for any extension permissions required for PASS
 * to work correctly. IE: on FF we absolutely need the user
 * to do so for fallback account communication to work  */
export const useNavigateToLogin = (options?: { autoClose: boolean }) => {
    const { createNotification } = useNotifications();
    const accountFork = useAccountFork();
    const permissionsGranted = usePermissionsGranted();

    return async (type: FORK_TYPE) => {
        if (permissionsGranted || (await promptForPermissions())) {
            return accountFork(type).finally(async () => {
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
