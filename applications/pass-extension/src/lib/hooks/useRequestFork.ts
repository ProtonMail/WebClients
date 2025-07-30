import { useCallback } from 'react';

import config from 'proton-pass-extension/app/config';
import { promptForPermissions } from 'proton-pass-extension/lib/utils/permissions';
import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import type { RequestForkData, RequestForkOptions } from '@proton/pass/lib/auth/fork';
import { getStateKey, requestFork } from '@proton/pass/lib/auth/fork';
import browser from '@proton/pass/lib/globals/browser';
import { ForkType } from '@proton/shared/lib/authentication/fork/constants';
import { APPS, PASS_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { usePermissionsGranted } from './usePermissionsGranted';

type UseRequestForkOptions = Partial<RequestForkOptions & { data: RequestForkData; replace: boolean }>;
type UseRequestForkWithPermissionsOptions = Partial<{ autoClose: boolean; replace: boolean }>;

/* depending on where we execute this : we may or may not
 * have access to the tabs API - Firefox content-scripts have
 * very limited support for the tabs API */
export const useRequestFork = () =>
    useCallback(async ({ data, replace, ...options }: UseRequestForkOptions) => {
        const { url, state } = requestFork({
            ...options,
            host: config.SSO_URL,
            app: APPS.PROTONPASSBROWSEREXTENSION,
            plan: BUILD_TARGET === 'safari' && options.forkType === ForkType.SIGNUP ? 'free' : undefined,
        });

        if (data) await browser.storage.session.set({ [getStateKey(state)]: JSON.stringify(data) }).catch(noop);
        if (replace) return window.location.replace(url);
        return browser.tabs ? browser.tabs.create({ url }).catch(noop) : window.open(url, '_BLANK');
    }, []);

/* before navigating to login we should prompt the
 * user for any extension permissions required for PASS
 * to work correctly. IE: on FF we absolutely need the user
 * to do so for fallback account communication to work  */
export const useRequestForkWithPermissions = ({ replace, autoClose }: UseRequestForkWithPermissionsOptions) => {
    const { createNotification } = useNotifications();
    const accountFork = useRequestFork();
    const permissionsGranted = usePermissionsGranted();

    return async (forkType?: ForkType) => {
        if (permissionsGranted || (await promptForPermissions())) {
            return accountFork({ forkType, replace }).finally(async () => autoClose && window.close());
        }

        createNotification({
            type: 'error',
            text: c('Error').t`Please grant ${PASS_APP_NAME} the necessary extension permissions in order to continue`,
            expiration: -1,
        });
    };
};
