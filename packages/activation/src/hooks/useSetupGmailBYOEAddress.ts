import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { findUserAddress, getIsBYOEAddress } from '@proton/shared/lib/helpers/address';
import { getEmailParts } from '@proton/shared/lib/helpers/email';
import { hasPaidMail } from '@proton/shared/lib/user/helpers';
import { useFlag } from '@proton/unleash/useFlag';

import { checkExternalAddressClaimable, startEasySwitchSignupImportTask } from '../api/api';
import { BYOE_QUOTA_THRESHOLD_RATIO } from '../constants';
import { getStartTimeFromTimePeriod } from '../helpers/getStartTimeFromTimePeriod';
import {
    BYOE_ADDRESS_ERROR,
    type EASY_SWITCH_SOURCES,
    type ImportToken,
    OAUTH_PROVIDER,
    type TIME_PERIOD,
} from '../interface';
import { loadImporters } from '../logic/importers/importers.actions';
import { useEasySwitchDispatch, useEasySwitchSelector } from '../logic/store';
import { loadSyncList } from '../logic/sync/sync.actions';
import { getAllSync } from '../logic/sync/sync.selectors';
import {
    trackAccountImportBYOEAuthenticated,
    trackAccountImportBYOEError,
    trackAccountImportBYOEFinished,
} from '../telemetry/accountImportFlow';
import { convertBYOEAddress, createBYOEAddress } from '../thunks/byoeAddresses';
import { updateBYOEAddressConnection } from '../thunks/updateBYOEAddressConnection';
import useBYOEFeatureStatus from './useBYOEFeatureStatus';

interface Props {
    showSuccessModal: (connectedAddress: string, importEmails: boolean) => void;
    showAddressLinkedToAnotherAccountModal: () => void;
    showClaimableAddressModal: (email: string, importEmails: boolean, importPeriod: TIME_PERIOD | undefined) => void;
    onComplete: () => void;
    source: EASY_SWITCH_SOURCES;
}

const useSetupGmailBYOEAddress = ({
    showSuccessModal,
    showAddressLinkedToAnotherAccountModal,
    showClaimableAddressModal,
    onComplete,
    source,
}: Props) => {
    const api = useApi();
    const [addresses] = useAddresses();
    const [user] = useUser();
    const [hasAccessToBYOE] = useBYOEFeatureStatus();
    const canClaimExternalAddress = useFlag('CanClaimExternalAddress');

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
            trackAccountImportBYOEError({ errorStep: 'address_creation' });
            onError();
            onComplete();
        }
    };

    const finalizeBYOEAddress = async ({
        account,
        importEmails,
        importPeriod,
        isClaimedAddress,
    }: {
        account: string;
        importEmails: boolean;
        importPeriod: TIME_PERIOD | undefined;
        isClaimedAddress: boolean;
    }) => {
        const existingAddress = findUserAddress(account, addresses);

        let address;
        if (existingAddress) {
            try {
                address = await dispatch(convertBYOEAddress({ addressID: existingAddress.ID }));
                await dispatch(updateBYOEAddressConnection({ address: existingAddress, type: 'reconnect' }));
            } catch (e) {
                handleError(e);
                trackAccountImportBYOEError({ errorStep: 'address_creation' });
                createNotification({
                    type: 'error',
                    text: c('Error').t`Something went wrong while converting the address`,
                });
                onComplete();
                return;
            }
        } else {
            address = await handleCreateAddress({
                connectedAddress: account,
                onError: () => {
                    createNotification({
                        type: 'error',
                        text: c('Error').t`Something went wrong while creating the address`,
                    });
                },
            });
        }

        if (address) {
            trackAccountImportBYOEFinished({
                hasImportEmails: importEmails,
                importPeriod,
                isUpsellShown: !hasPaidMail(user) && importEmails,
                isClaimedAddress,
            });
            onComplete();
            void easySwitchDispatch(loadSyncList());
            void easySwitchDispatch(loadImporters());
            showSuccessModal(address.Email, importEmails);
        }
    };

    const handleBYOEWithImportCallback = async ({
        hasError,
        importEmails,
        importPeriod,
        token,
    }: {
        hasError: boolean;
        importEmails: boolean;
        importPeriod: TIME_PERIOD | undefined;
        token?: ImportToken;
    }) => {
        // If setting up the token failed or user has no access to BYOE, close the modal
        if (!hasAccessToBYOE || hasError) {
            if (hasAccessToBYOE) {
                trackAccountImportBYOEError({ errorStep: 'authentication' });
            }
            onComplete();
            return;
        }

        if (!hasError && token) {
            trackAccountImportBYOEAuthenticated();
            const existingAddress = findUserAddress(token.Account, addresses);

            if (existingAddress && getIsBYOEAddress(existingAddress)) {
                trackAccountImportBYOEError({ errorStep: 'address_already_connected' });
                createNotification({
                    type: 'error',
                    text: c('Error').t`Address is already added to your account`,
                });
                onComplete();
                return;
            }

            try {
                await api({
                    ...startEasySwitchSignupImportTask({
                        Provider: OAUTH_PROVIDER.GOOGLE,
                        Source: source,
                        Account: token.Account,
                        AutomaticImport: importEmails,
                        QuotaThresholdRatio: BYOE_QUOTA_THRESHOLD_RATIO,
                        StartTime: importEmails && importPeriod ? getStartTimeFromTimePeriod(importPeriod) : undefined,
                    }),
                    silence: [BYOE_ADDRESS_ERROR.ADDRESS_ALREADY_EXISTS],
                });
            } catch (e) {
                const { code } = getApiError(e);

                if (code === BYOE_ADDRESS_ERROR.ADDRESS_ALREADY_EXISTS) {
                    let isClaimable = false;
                    try {
                        // We want to gate the API call to avoid making it if the feature is not enabled
                        if (canClaimExternalAddress) {
                            const response = await api<{ CanBeClaimed: boolean }>(
                                checkExternalAddressClaimable(token.Account)
                            );
                            isClaimable = response?.CanBeClaimed === true;
                        }
                    } catch {
                        isClaimable = false;
                    }

                    if (isClaimable) {
                        showClaimableAddressModal(token.Account, importEmails, importPeriod);
                    } else {
                        trackAccountImportBYOEError({ errorStep: 'address_linked_to_another_account' });
                        showAddressLinkedToAnotherAccountModal();
                    }
                    onComplete();
                    return;
                }

                handleError(e);
                trackAccountImportBYOEError({ errorStep: 'address_creation' });
                onComplete();
                return;
            }

            await finalizeBYOEAddress({
                account: token.Account,
                importEmails,
                importPeriod,
                isClaimedAddress: false,
            });
        }
    };

    const handleClaimAddress = async ({
        account,
        importEmails,
        importPeriod,
    }: {
        account: string;
        importEmails: boolean;
        importPeriod: TIME_PERIOD | undefined;
    }): Promise<boolean> => {
        if (!canClaimExternalAddress) {
            return false;
        }

        try {
            await api(
                startEasySwitchSignupImportTask({
                    Provider: OAUTH_PROVIDER.GOOGLE,
                    Source: source,
                    Account: account,
                    AutomaticImport: importEmails,
                    QuotaThresholdRatio: BYOE_QUOTA_THRESHOLD_RATIO,
                    StartTime: importEmails && importPeriod ? getStartTimeFromTimePeriod(importPeriod) : undefined,
                    ClaimAddress: true,
                })
            );
        } catch (e) {
            handleError(e);
            trackAccountImportBYOEError({ errorStep: 'address_creation' });
            onComplete();
            return false;
        }

        // The claim itself succeeded, so the modal can close even if finalizing fails (it reports its own errors)
        try {
            await finalizeBYOEAddress({ account, importEmails, importPeriod, isClaimedAddress: true });
        } catch (e) {
            handleError(e);
        }
        return true;
    };

    return { handleBYOEWithImportCallback, handleClaimAddress, allSyncs };
};

export default useSetupGmailBYOEAddress;
