import { c } from 'ttag';

import { updateBYOEAddressConnection } from '@proton/account/addressKeys/actions';
import { convertBYOEAddress, createBYOEAddress } from '@proton/account/addresses/actions';
import { useAddresses } from '@proton/account/addresses/hooks';
import { startEasySwitchSignupImportTask } from '@proton/activation/src/api';
import { BYOE_QUOTA_THRESHOLD_RATIO } from '@proton/activation/src/constants';
import { type EASY_SWITCH_SOURCES, type ImportToken, OAUTH_PROVIDER } from '@proton/activation/src/interface';
import { loadImporters } from '@proton/activation/src/logic/importers/importers.actions';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { loadSyncList } from '@proton/activation/src/logic/sync/sync.actions';
import { getAllSync } from '@proton/activation/src/logic/sync/sync.selectors';
import useApi from '@proton/components/hooks/useApi';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { findUserAddress, getIsBYOEAddress } from '@proton/shared/lib/helpers/address';
import { getEmailParts } from '@proton/shared/lib/helpers/email';
import { useFlag } from '@proton/unleash/useFlag';

import useBYOEFeatureStatus from './useBYOEFeatureStatus';

interface Props {
    showSuccessModal: (connectedAddress: string) => void;
    onComplete?: () => void;
    source: EASY_SWITCH_SOURCES;
}

const useSetupGmailBYOEAddress = ({ showSuccessModal, onComplete, source }: Props) => {
    const api = useApi();
    const [addresses] = useAddresses();
    const [hasAccessToBYOE] = useBYOEFeatureStatus();
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

        try {
            const address = await dispatch(createBYOEAddress({ emailAddressParts: { Local: local, Domain: domain } }));

            return address;
        } catch (e) {
            handleError(e);
            onError();
            onComplete?.();
        }
    };

    const handleBYOEWithImportCallback = async (hasError: boolean, importEmails: boolean, token?: ImportToken) => {
        // If setting up the token failed or user has no access to BYOE, close the modal
        if (!hasAccessToBYOE || hasError) {
            onComplete?.();
            return;
        }

        if (!hasError && token) {
            const existingAddress = findUserAddress(token.Account, addresses);

            if (existingAddress && getIsBYOEAddress(existingAddress)) {
                createNotification({
                    type: 'error',
                    text: c('Error').t`Address is already added to your account`,
                });
                onComplete?.();
                return;
            }

            try {
                await api(
                    startEasySwitchSignupImportTask({
                        Provider: OAUTH_PROVIDER.GOOGLE,
                        Source: source,
                        Account: token.Account,
                        AutomaticImport: importEmails,
                        QuotaThresholdRatio: BYOE_QUOTA_THRESHOLD_RATIO,
                    })
                );
            } catch (e) {
                handleError(e);
                onComplete?.();
                return;
            }

            let address;
            if (existingAddress) {
                try {
                    address = await dispatch(convertBYOEAddress({ addressID: existingAddress.ID }));
                    await dispatch(updateBYOEAddressConnection({ address: existingAddress, type: 'reconnect' }));
                } catch (e) {
                    handleError(e);
                    createNotification({
                        type: 'error',
                        text: c('Error').t`Something went wrong while converting the address`,
                    });
                    onComplete?.();
                    return;
                }
            } else {
                address = await handleCreateAddress({
                    connectedAddress: token.Account,
                    onError: () => {
                        createNotification({
                            type: 'error',
                            text: c('Error').t`Something went wrong while creating the address`,
                        });
                    },
                });
            }

            if (address) {
                onComplete?.();
                void easySwitchDispatch(loadSyncList());
                void easySwitchDispatch(loadImporters());
                showSuccessModal(address.Email);
            }
        }
    };

    return { isInMaintenance, handleBYOEWithImportCallback, allSyncs };
};

export default useSetupGmailBYOEAddress;
