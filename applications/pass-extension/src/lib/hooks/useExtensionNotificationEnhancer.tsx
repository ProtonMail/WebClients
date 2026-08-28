import { useMemo } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { useNotificationEnhancer } from '@proton/pass/hooks/useNotificationEnhancer';
import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import { NotificationKey } from '@proton/pass/types/worker/notification';

import { getMinimalHostPermissions } from '../utils/permissions';
import { getHostPermissionsWarning, useRequestHostPermissions } from './useHostPermissions';

export const useExtensionNotificationEnhancer = () => {
    const { clearNotifications } = useNotifications();
    const config = usePassConfig();
    const requestHostPermissions = useRequestHostPermissions(clearNotifications);

    return useNotificationEnhancer(
        useMemo(() => {
            const hosts = getMinimalHostPermissions(config);
            const request = () => requestHostPermissions(hosts);

            return {
                [NotificationKey.EXT_PERMISSIONS]: {
                    key: 'ext-permissions',
                    type: 'error',
                    expiration: -1,
                    text: getHostPermissionsWarning(
                        hosts,
                        <InlineLinkButton className="text-strong block" onClick={request}>
                            {c('Title').t`Grant permissions`}
                        </InlineLinkButton>
                    ),
                },
            };
        }, [])
    );
};
