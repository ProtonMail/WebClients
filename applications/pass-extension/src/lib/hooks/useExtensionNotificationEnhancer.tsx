import { useMemo } from 'react';

import {
    getHostPermissionsWarning,
    useRequestHostPermissions,
} from 'proton-pass-extension/lib/hooks/useHostPermissions';
import { getMinimalHostPermissions } from 'proton-pass-extension/lib/utils/permissions';
import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useNotificationEnhancer } from '@proton/pass/hooks/useNotificationEnhancer';
import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import { NotificationKey } from '@proton/pass/types/worker/notification';

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
