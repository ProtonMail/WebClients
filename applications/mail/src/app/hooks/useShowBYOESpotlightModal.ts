import { useEffect, useMemo, useRef } from 'react';

import { differenceInDays, fromUnixTime } from 'date-fns';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useUser } from '@proton/account/user/hooks';
import useBYOEFeatureStatus from '@proton/activation/src/hooks/useBYOEFeatureStatus';
import { useEasySwitchSelector } from '@proton/activation/src/logic/store';
import type { Sync } from '@proton/activation/src/logic/sync/sync.interface';
import { getAllSync, selectSyncListLoadingState } from '@proton/activation/src/logic/sync/sync.selectors';
import { FeatureCode, useFeature } from '@proton/features';
import { domIsBusy } from '@proton/shared/lib/busy';
import { getIsBYOEOnlyAccount } from '@proton/shared/lib/helpers/address';

import { useMailGlobalModals } from '../containers/globalModals/GlobalModalProvider';
import { ModalType } from '../containers/globalModals/inteface';

const useShowBYOESpotlightModal = () => {
    const notifiedRef = useRef(false);
    const [user] = useUser();
    const [addresses = []] = useAddresses();
    const allSyncs = useEasySwitchSelector(getAllSync);
    const syncListLoaded = useEasySwitchSelector(selectSyncListLoadingState);
    const { feature, update, loading: loadingFeature } = useFeature(FeatureCode.BYOESpotlightModal);
    const { notify } = useMailGlobalModals();

    const [hasAccessToBYOE, loadingBYOEFeatureStatus] = useBYOEFeatureStatus(false);

    const { forwardingSyncs, byoeSyncs } = useMemo(() => {
        const emailsFromAddresses = new Set(addresses.map((address) => address.Email));
        return allSyncs.reduce<{ forwardingSyncs: Sync[]; byoeSyncs: Sync[] }>(
            (acc, sync) => {
                if (emailsFromAddresses.has(sync.account)) {
                    acc.byoeSyncs.push(sync);
                } else {
                    acc.forwardingSyncs.push(sync);
                }
                return acc;
            },
            { forwardingSyncs: [], byoeSyncs: [] }
        );
    }, [addresses, allSyncs]);

    // Show the modal if:
    // - User has access to BYOE (feature flag ON && not b2b sub user)
    // - User has no BYOE address && is not a BYOE only account
    // - User created its account more than 30 days ago
    // - User never seen the modal before (old feature flag system)
    // - User is not busy
    const canShowBYOESpotlightModal =
        !notifiedRef.current &&
        !loadingBYOEFeatureStatus &&
        hasAccessToBYOE &&
        !getIsBYOEOnlyAccount(addresses) &&
        byoeSyncs.length === 0 &&
        syncListLoaded === 'success' &&
        differenceInDays(new Date(), fromUnixTime(user.CreateTime)) >= 30 &&
        !loadingFeature &&
        !!feature?.Value &&
        !domIsBusy();

    useEffect(() => {
        if (canShowBYOESpotlightModal) {
            notifiedRef.current = true; // We only want to notify once
            notify({
                type: ModalType.BYOESpotlight,
                value: {
                    forwardingSyncs,
                    onDisplayed: () => {
                        void update(false);
                    },
                },
            });
        }
    }, [canShowBYOESpotlightModal, forwardingSyncs, notify, update]);
};

export default useShowBYOESpotlightModal;
