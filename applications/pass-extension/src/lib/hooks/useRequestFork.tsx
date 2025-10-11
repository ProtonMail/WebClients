import { useCallback, useMemo } from 'react';

import config from 'proton-pass-extension/app/config';
import { getMinimalHostPermissions } from 'proton-pass-extension/lib/utils/permissions';
import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import useNotifications from '@proton/components/hooks/useNotifications';
import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import type { RequestForkData, RequestForkOptions } from '@proton/pass/lib/auth/fork';
import { getStateKey, requestFork } from '@proton/pass/lib/auth/fork';
import browser from '@proton/pass/lib/globals/browser';
import { ForkType } from '@proton/shared/lib/authentication/fork/constants';
import { APPS } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { getHostPermissionsWarning, useHostPermissions } from './useHostPermissions';

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
