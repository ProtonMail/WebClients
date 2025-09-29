import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';

import { useExtensionContext } from 'proton-pass-extension/lib/components/Extension/ExtensionSetup';
import { matchExtensionMessage } from 'proton-pass-extension/lib/message/utils';
import { hasHostPermissions, requestHostPermissions } from 'proton-pass-extension/lib/utils/permissions';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';
import { c } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';
import useNotifications from '@proton/components/hooks/useNotifications';
import { PASS_APP_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

export const formatOrigins = (origins: string[]): string => {
    if (origins.length === 0) return '';
    if (origins.length === 1) return new URL(origins[0]).hostname;

    return origins.reduce((str, origin, idx) => {
        const { hostname } = new URL(origin);
        if (idx === origins.length - 1) return `${str} ${c('Action').t`and`} "${hostname}"`;
        if (idx > 0) return `${str}, "${hostname}"`;
        return `"${hostname}"`;
    }, '');
};

export const getHostPermissionInstructions = (): string => {
    switch (BUILD_TARGET) {
        case 'safari':
            // translator: safari specific steps
            return c('Info')
                .t`Open the Safari settings, find ${PASS_APP_NAME}, go to "Permissions" and enable site permissions.`;
        case 'chrome':
            // translator: chrome specific steps
            return c('Info')
                .t`Right-click the extension icon and select "Manage extension". Navigate to "Site access" and enable site permissions.`;
        case 'firefox':
            // translator: firefox specific steps
            return c('Info')
                .t`Right-click the extension icon and select "Manage extension". Navigate to "Permissions & data" and enable site permissions.`;
        default:
            return c('Info')
                .t`Navigate to your browser's extension settings and enable site permissions for ${PASS_SHORT_APP_NAME}.`;
    }
};

export const getHostPermissionsWarning = (origins: string[], action?: ReactNode): ReactNode => {
    const domains = formatOrigins(origins);
    // translator: $domains is a list of comma seperated domains the extension needs access to
    const permissionsJSX = c('Info').jt`access to ${domains}.`;

    return (
        <span className="flex gap-1">
            {c('Error')
                .jt`In order to continue, ${PASS_APP_NAME} requires these extension permissions: ${permissionsJSX}`}
            {action}
        </span>
    );
};

export const getHostPermissionsError = (origins?: string[]): ReactNode => {
    const base = (() => {
        if (!origins) return c('Error').t`Permission denied for website access.`;
        const domainsJSX = formatOrigins(origins);
        // translator: $domains is a list of comma seperated domains the extension needs access to
        return c('Error').jt`Permission denied for ${domainsJSX} website access.`;
    })();

    const instructions = getHostPermissionInstructions();

    return (
        <span className="flex gap-1">
            {base}
            <span className="text-sm">
                <Icon name="info-circle" size={2.5} className="mr-1" />
                {instructions}
            </span>
        </span>
    );
};

export const useRequestHostPermissions = (onResult?: (granted: boolean) => void) => {
    const { createNotification } = useNotifications();

    return useCallback(
        (origins?: string[]): Promise<void> =>
            requestHostPermissions(origins)
                .then((granted) => {
                    onResult?.(granted);
                    if (!granted) {
                        createNotification({
                            type: 'error',
                            text: getHostPermissionsError(origins),
                            expiration: 10_000,
                        });
                    }
                })
                .catch(noop),
        [onResult]
    );
};

/** Checks permissions on mount via browser API, then listens for worker
 * `PERMISSIONS_UPDATE` messages to handle permission changes while clients run. */
export const useHostPermissions = (
    origins: string[],
    onGranted?: (granted: boolean) => void
): [boolean, () => Promise<void>] => {
    const [granted, setGranted] = useState<boolean>(false);
    const { port } = useExtensionContext();

    const requestHostPermissions = useRequestHostPermissions((granted) => {
        setGranted(granted);
        onGranted?.(granted);
    });

    useEffect(() => {
        const checkHostPermissions = () => {
            void hasHostPermissions(origins).then(setGranted);
        };

        const handleMessage = (message: unknown) => {
            if (matchExtensionMessage(message, { sender: 'background', type: WorkerMessageType.PERMISSIONS_UPDATE })) {
                checkHostPermissions();
            }
        };

        checkHostPermissions();
        port.onMessage.addListener(handleMessage);
        return () => port.onMessage.removeListener(handleMessage);
    }, [origins]);

    return [granted, () => requestHostPermissions(origins)];
};
