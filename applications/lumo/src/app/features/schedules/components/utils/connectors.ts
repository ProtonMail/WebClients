import { c } from 'ttag';

import type { DesktopConnector } from '@proton/lumo-api-client/core/desktop-tools';

/** Returns the user-facing label for a connector's unavailability status. */
export const getConnectorStatusLabel = (connector: DesktopConnector, options: { a11y?: boolean } = {}): string => {
    const status = connector.status;

    if (status?.state === 'not_ready') {
        if (status.reason === 'Not connected yet') {
            // translator: Connector connection status, before a connection has been established.
            return c('collider_2025:Label').t`Not connected`;
        }
        // translator: Connector connection status, after a failed connection attempt.
        return c('collider_2025:Label').t`Connection failed`;
    }

    if (connector?.enabled === false) {
        return options.a11y
            ? // translator: Accessibility label for a disabled connector by user's settings.
              c('collider_2025:Label').t`Currently disabled by your settings`
            : // translator: Status label for a connector disabled by user's settings.
              c('collider_2025:Label').t`Disabled`;
    }

    if (status?.state === 'warning') {
        // translator: Connector connection status, when a previously connected service has an error.
        return c('collider_2025:Label').t`Connected with issues`;
    }

    if (status?.state === 'ready') {
        // translator: Connector connection status, when the connection is ready.
        return c('collider_2025:Label').t`Connected`;
    }

    // translator: Fallback connection status when Desktop does not provide connector status metadata.
    return c('collider_2025:Label').t`Not connected`;
};
