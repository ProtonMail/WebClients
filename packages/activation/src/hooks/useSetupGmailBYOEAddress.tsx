import { c } from 'ttag';

import { createBYOEAddress } from '@proton/account/addresses/actions';
import { useAddresses } from '@proton/account/addresses/hooks';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { deleteSyncItem } from '@proton/activation/src/logic/sync/sync.actions';
import type { Sync } from '@proton/activation/src/logic/sync/sync.interface';
import { getAllSync } from '@proton/activation/src/logic/sync/sync.selectors';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { findUserAddress } from '@proton/shared/lib/helpers/address';
import { getEmailParts } from '@proton/shared/lib/helpers/email';
import { useFlag } from '@proton/unleash';
import noop from '@proton/utils/noop';

import useBYOEFeatureStatus from './useBYOEFeatureStatus';

const useSetupGmailBYOEAddress = () => {
    const [addresses] = useAddresses();
    const hasAccessToBYOE = useBYOEFeatureStatus();
    const isInMaintenance = useFlag('MaintenanceImporter');
    const easySwitchDispatch = useEasySwitchDispatch();
    const allSyncs = useEasySwitchSelector(getAllSync);
    const handleError = useErrorHandler();

    const { createNotification } = useNotifications();
    const dispatch = useDispatch();

    const handleSyncCallback = async (hasError: boolean, sync?: Sync) => {
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

            // If the BYOE address is already part of the user addresses, no need to create it
            const emailAddress = `${emailAddressParts.Local}@${emailAddressParts.Domain}`;
            if (findUserAddress(emailAddress, addresses)) {
                createNotification({
                    type: 'error',
                    text: c('loc_nightly: BYOE').t`Address is already added to your account`,
                });
            } else {
                try {
                    const address = await dispatch(createBYOEAddress({ emailAddressParts }));

                    if (address) {
                        createNotification({ text: c('Success').t`Address successfully added` });
                    }
                } catch (e) {
                    handleError(e);
                    // If we're not able to add the address, we want to delete the forwarding we just added
                    void easySwitchDispatch(deleteSyncItem({ syncId: sync.id, showNotification: false })).catch(noop);
                }
            }
        }
    };

    return { hasAccessToBYOE, isInMaintenance, handleSyncCallback, allSyncs };
};

export default useSetupGmailBYOEAddress;
