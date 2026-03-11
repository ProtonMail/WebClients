import { c } from 'ttag';

import { createBYOEAddress } from '@proton/account/addresses/actions';
import { useAddresses } from '@proton/account/addresses/hooks';
import { startEasySwitchSignupImportTask } from '@proton/activation/src/api';
import { EASY_SWITCH_SOURCES, type ImportToken, OAUTH_PROVIDER } from '@proton/activation/src/interface';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { deleteSyncItem } from '@proton/activation/src/logic/sync/sync.actions';
import type { Sync } from '@proton/activation/src/logic/sync/sync.interface';
import { getAllSync } from '@proton/activation/src/logic/sync/sync.selectors';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useApi } from '@proton/components/index';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { findUserAddress } from '@proton/shared/lib/helpers/address';
import { getEmailParts } from '@proton/shared/lib/helpers/email';
import { useFlag } from '@proton/unleash/useFlag';
import noop from '@proton/utils/noop';

import useBYOEFeatureStatus from './useBYOEFeatureStatus';

interface Props {
    showSuccessModal: (connectedAddress: string) => void;
}

const useSetupGmailBYOEAddress = ({ showSuccessModal }: Props) => {
    const api = useApi();
    const [addresses] = useAddresses();
    const hasAccessToBYOE = useBYOEFeatureStatus();
    const isInMaintenance = useFlag('MaintenanceImporter');
    const easySwitchDispatch = useEasySwitchDispatch();
    const allSyncs = useEasySwitchSelector(getAllSync);
    const handleError = useErrorHandler();

    const { createNotification } = useNotifications();
    const dispatch = useDispatch();

    const handleCreateAddress = async ({
        connectedAddress,
        onError,
    }: {
        connectedAddress: string;
        onError: () => void;
    }) => {
        const [local, domain] = getEmailParts(connectedAddress);

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

                return address;
            } catch (e) {
                handleError(e);
                onError();
            }
        }
    };

    const handleSyncCallback = async (hasError: boolean, sync?: Sync) => {
        if (!hasAccessToBYOE) {
            return;
        }

        // If setting up the forwarding worked, we can add the sync address as an external address
        if (!hasError && sync) {
            const address = await handleCreateAddress({
                connectedAddress: sync.account,
                onError: () => {
                    // If we're not able to add the address, we want to delete the forwarding we just added
                    void easySwitchDispatch(deleteSyncItem({ syncId: sync.id, showNotification: false })).catch(noop);
                },
            });

            if (address) {
                showSuccessModal(address.Email);
            }
        }
    };

    const handleBYOEWithImportCallback = async (hasError: boolean, token?: ImportToken) => {
        if (!hasAccessToBYOE) {
            return;
        }

        // If setting up the token worked, we can create the BYOE address
        if (!hasError && token) {
            if (findUserAddress(token.Account, addresses)) {
                createNotification({
                    type: 'error',
                    text: c('loc_nightly: BYOE').t`Address is already added to your account`,
                });
                return;
            }

            try {
                // In this case we have no BYOE address yet, so we want to import user emails on the primary address
                await api(
                    startEasySwitchSignupImportTask({
                        Provider: OAUTH_PROVIDER.GOOGLE,
                        Source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS,
                        Account: token.Account,
                    })
                );
            } catch (e) {
                handleError(e);
                return;
            }

            const address = await handleCreateAddress({
                connectedAddress: token.Account,
                onError: () => {
                    createNotification({
                        type: 'error',
                        text: c('loc_nightly: BYOE').t`Something went wrong while creating the address`,
                    });
                },
            });

            if (address) {
                showSuccessModal(address.Email);
            }
        }
    };

    return { hasAccessToBYOE, isInMaintenance, handleSyncCallback, handleBYOEWithImportCallback, allSyncs };
};

export default useSetupGmailBYOEAddress;
