import { useEffect } from 'react';

import { c } from 'ttag';

import { createBYOEAddress } from '@proton/account/addresses/actions';
import {
    G_OAUTH_SCOPE_DEFAULT,
    G_OAUTH_SCOPE_MAIL_FULL_SCOPE,
    G_OAUTH_SCOPE_PROFILE,
    SYNC_G_OAUTH_SCOPES,
} from '@proton/activation/src/constants';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { loadSyncList } from '@proton/activation/src/logic/sync/sync.actions';
import type { Sync } from '@proton/activation/src/logic/sync/sync.interface';
import { getAllSync } from '@proton/activation/src/logic/sync/sync.selectors';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { getEmailParts } from '@proton/shared/lib/helpers/email';
import { useFlag } from '@proton/unleash/index';

const useSetupGmailBYOEAddress = () => {
    const hasAccessToBYOE = useFlag('InboxBringYourOwnEmail');
    const isInMaintenance = useFlag('MaintenanceImporter');
    const easySwitchDispatch = useEasySwitchDispatch();
    const allSyncs = useEasySwitchSelector(getAllSync);

    const { createNotification } = useNotifications();
    const dispatch = useDispatch();

    const googleOAuthScope = hasAccessToBYOE
        ? [...G_OAUTH_SCOPE_DEFAULT, ...G_OAUTH_SCOPE_MAIL_FULL_SCOPE, ...G_OAUTH_SCOPE_PROFILE].join(' ')
        : SYNC_G_OAUTH_SCOPES.join(' ');

    // Fetch syncs
    useEffect(() => {
        const request = easySwitchDispatch(loadSyncList());
        return () => {
            request.abort();
        };
    }, []);

    const handleSyncCallback = async (hasError: boolean, sync?: Sync, displayName?: string) => {
        if (!hasAccessToBYOE) {
            return;
        }

        // If setting up the forwarding worked, we can add the sync address as an external address
        if (!hasError && sync) {
            const [local, domain] = getEmailParts(sync.account);

            const emailAddressParts = {
                Local: local,
                Domain: domain,
            };

            const address = await dispatch(
                createBYOEAddress({
                    emailAddressParts,
                    displayName,
                })
            );

            if (address) {
                createNotification({ text: c('Success').t`Address added` });
            }
        }
    };

    return { hasAccessToBYOE, isInMaintenance, googleOAuthScope, handleSyncCallback, allSyncs };
};

export default useSetupGmailBYOEAddress;
