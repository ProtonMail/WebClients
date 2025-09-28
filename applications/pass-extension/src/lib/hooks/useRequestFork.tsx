import { useCallback, useMemo, useRef } from 'react';

import config from 'proton-pass-extension/app/config';
import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms';
import { useNotifications } from '@proton/components';
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
    const { createNotification, removeNotification } = useNotifications();

    const { SSO_URL, API_URL } = usePassConfig();
    const accountFork = useRequestFork();

    const notification = useRef<number>();
    const clearNotification = () => removeNotification(notification.current ?? -1);

    /** Host permissions required for successful login on Proton domains.
     * Critical in Firefox & Safari for fallback account communication.
     * Does not request `<all_urls>` permissions needed for autofill. */
    const origins = useMemo(() => [`${SSO_URL}/*`, API_URL.replace(/\api$/, '*')], []);
    const [granted, request] = useHostPermissions(origins, clearNotification);

    return async (forkType?: ForkType) => {
        clearNotification();
        if (granted) return accountFork({ forkType, replace }).finally(() => autoClose && window.close());

        notification.current = createNotification({
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
