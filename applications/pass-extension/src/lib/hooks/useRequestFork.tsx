import { useCallback, useMemo } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import type { RequestForkData, RequestForkOptions } from '@proton/pass/lib/auth/fork';
import { getStateKey, requestFork } from '@proton/pass/lib/auth/fork';
import browser from '@proton/pass/lib/globals/browser';
import { ForkType } from '@proton/shared/lib/authentication/fork/constants';
import { APPS } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import config from '../../app/config';
import { getMinimalHostPermissions } from '../utils/permissions';
import { assertTabsAPIAvailable } from '../utils/tabs';
import { getHostPermissionsWarning, useHostPermissions } from './useHostPermissions';

type UseRequestForkOptions = Partial<RequestForkOptions & { data: RequestForkData; replace: boolean }>;
type UseRequestForkWithPermissionsOptions = Partial<{ autoClose: boolean; replace: boolean }>;

export const useRequestFork = () => {
    const { endpoint } = usePassCore();

    return useCallback(async ({ data, replace, ...options }: UseRequestForkOptions) => {
        const { url, state } = requestFork({
            ...options,
            host: config.SSO_URL,
            app: APPS.PROTONPASSBROWSEREXTENSION,
            plan: BUILD_TARGET === 'safari' && options.forkType === ForkType.SIGNUP ? 'free' : undefined,
        });

        if (data) await browser.storage.session.set({ [getStateKey(state)]: JSON.stringify(data) }).catch(noop);
        if (replace) return window.location.replace(url);

        if (assertTabsAPIAvailable(endpoint)) browser.tabs.create({ url }).catch(noop);
        else window.open(url, '_BLANK');
    }, []);
};

/** Prompts for extension permissions required for login before navigating.
 * Essential on Firefox & Safari for fallback account communication to function. */
export const useRequestForkWithPermissions = ({ replace, autoClose }: UseRequestForkWithPermissionsOptions) => {
    const { createNotification, clearNotifications } = useNotifications();

    const config = usePassConfig();
    const accountFork = useRequestFork();

    /** Host permissions required for successful login on Proton domains.
     * Critical in Firefox & Safari for fallback account communication.
     * Does not request `<all_urls>` permissions needed for autofill. */
    const origins = useMemo(() => getMinimalHostPermissions(config), []);
    const [granted, request] = useHostPermissions(origins, clearNotifications);

    return async (forkType?: ForkType) => {
        clearNotifications();
        if (granted) return accountFork({ forkType, replace }).finally(() => autoClose && window.close());

        createNotification({
            type: 'error',
            expiration: -1,
            text: getHostPermissionsWarning(
                origins,
                <InlineLinkButton className="text-strong block" onClick={request}>
                    {c('Title').t`Grant permissions`}
                </InlineLinkButton>
            ),
        });
    };
};
