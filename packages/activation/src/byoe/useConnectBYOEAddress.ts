import { useAddresses } from '@proton/account/addresses/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { getApiError, getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { findUserAddress, getIsBYOEAddress } from '@proton/shared/lib/helpers/address';
import { getEmailParts } from '@proton/shared/lib/helpers/email';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import { useFlag } from '@proton/unleash/useFlag';

import { checkExternalAddressClaimable, startEasySwitchSignupImportTask } from '../api/api';
import { BYOE_QUOTA_THRESHOLD_RATIO } from '../constants';
import { getStartTimeFromTimePeriod } from '../helpers/getStartTimeFromTimePeriod';
import useBYOEFeatureStatus from '../hooks/useBYOEFeatureStatus';
import {
    BYOE_ADDRESS_ERROR,
    EASY_SWITCH_FEATURES,
    type EASY_SWITCH_SOURCES,
    type ImportToken,
    OAUTH_PROVIDER,
    type TIME_PERIOD,
} from '../interface';
import { loadImporters } from '../logic/importers/importers.actions';
import { useEasySwitchDispatch } from '../logic/store';
import { WRONG_ACCOUNT_ERROR, createTokenItem, loadSyncList } from '../logic/sync/sync.actions';
import {
    trackAccountImportBYOEAuthenticated,
    trackAccountImportBYOEError,
    trackAccountImportBYOEFinished,
} from '../telemetry/accountImportFlow';
import { convertBYOEAddress, createBYOEAddress } from '../thunks/byoeAddresses';
import { updateBYOEAddressConnection } from '../thunks/updateBYOEAddressConnection';
import type {
    ConnectBYOEAddressFailure,
    ConnectBYOEAddressFailureResult,
    ConnectBYOEAddressResult,
    FinalizeAddressResult,
    StartImportTaskResult,
} from './connectBYOEAddress.interface';

/** Returns a failure result with the given reason. */
const fail = (reason: ConnectBYOEAddressFailure): ConnectBYOEAddressFailureResult => {
    return { status: 'failure', reason };
};

/** BYOE is Gmail only for now, so the provider is hardcoded to Google. Outlook will need it as a parameter. */
export const useConnectBYOEAddress = ({ source }: { source: EASY_SWITCH_SOURCES }) => {
    const api = useApi();
    const [addresses] = useAddresses();
    const [hasAccessToBYOE] = useBYOEFeatureStatus();

    const dispatch = useDispatch();
    const easySwitchDispatch = useEasySwitchDispatch();

    const canClaimExternalAddress = useFlag('CanClaimExternalAddress');

    /** Whether an address that already exists on another account can be claimed by this user. */
    const canAddressBeClaimed = async (account: string): Promise<boolean> => {
        if (!canClaimExternalAddress) {
            return false;
        }

        try {
            const response = await api<{ CanBeClaimed: boolean }>(checkExternalAddressClaimable(account));
            return response?.CanBeClaimed === true;
        } catch {
            return false;
        }
    };

    /** Starts the import task, mapping the "address belongs to another account" error to a failure. */
    const startImportTask = async ({
        account,
        importEmails,
        importPeriod,
        claimAddress,
    }: {
        account: string;
        importEmails: boolean;
        importPeriod?: TIME_PERIOD;
        /** Takes over an address that is used on another account. Only after the user confirmed it. */
        claimAddress?: boolean;
    }): Promise<StartImportTaskResult> => {
        try {
            await api({
                ...startEasySwitchSignupImportTask({
                    Provider: OAUTH_PROVIDER.GOOGLE,
                    Source: source,
                    Account: account,
                    AutomaticImport: importEmails,
                    QuotaThresholdRatio: BYOE_QUOTA_THRESHOLD_RATIO,
                    StartTime: importEmails && importPeriod ? getStartTimeFromTimePeriod(importPeriod) : undefined,
                    ...(claimAddress ? { ClaimAddress: true } : {}),
                }),
                silence: [BYOE_ADDRESS_ERROR.ADDRESS_ALREADY_EXISTS],
            });
            return { status: 'started' };
        } catch (error) {
            const { code } = getApiError(error);
            if (code === BYOE_ADDRESS_ERROR.ADDRESS_ALREADY_EXISTS) {
                const canBeClaimed = await canAddressBeClaimed(account);
                if (canBeClaimed) {
                    return fail({ type: 'claimable-address', email: account, importEmails, importPeriod });
                } else {
                    return fail({ type: 'linked-to-another-account' });
                }
            }

            return fail({ type: 'unknown', message: getApiErrorMessage(error) });
        }
    };

    /** Converts the existing address to BYOE, or creates it when the account has none. */
    const finalizeAddress = async (
        existingAddress: Address | undefined,
        account: string
    ): Promise<FinalizeAddressResult> => {
        if (existingAddress) {
            try {
                const address = await dispatch(convertBYOEAddress({ addressID: existingAddress.ID }));
                await dispatch(updateBYOEAddressConnection({ address: existingAddress, type: 'reconnect' }));
                return { status: 'finalized', address };
            } catch (error) {
                const message = getApiErrorMessage(error);
                return fail({ type: 'convert-failed', message });
            }
        }

        const [local, domain] = getEmailParts(account);
        try {
            const address = await dispatch(createBYOEAddress({ emailAddressParts: { Local: local, Domain: domain } }));
            return { status: 'finalized', address };
        } catch (error) {
            const message = getApiErrorMessage(error);
            return fail({ type: 'create-failed', message });
        }
    };

    /** A claimable address is not an error: the user goes on to claim it. */
    const trackImportTaskFailure = (reason: ConnectBYOEAddressFailure) => {
        if (reason.type === 'linked-to-another-account') {
            trackAccountImportBYOEError({ errorStep: 'address_linked_to_another_account' });
        } else if (reason.type !== 'claimable-address') {
            trackAccountImportBYOEError({ errorStep: 'address_creation' });
        }
    };

    /** Last step shared by connecting and claiming: sets up the address, then refreshes the Easy Switch data. */
    const completeConnection = async ({
        existingAddress,
        account,
        importEmails,
        importPeriod,
        isClaimedAddress,
    }: {
        existingAddress: Address | undefined;
        account: string;
        importEmails: boolean;
        importPeriod?: TIME_PERIOD;
        isClaimedAddress: boolean;
    }): Promise<ConnectBYOEAddressResult> => {
        const finalized = await finalizeAddress(existingAddress, account);
        if (finalized.status === 'failure') {
            trackAccountImportBYOEError({ errorStep: 'address_creation' });
            return finalized;
        }
        // Convert or create returned no address
        if (!finalized.address) {
            trackAccountImportBYOEError({ errorStep: 'address_creation' });
            return fail({ type: 'unknown' });
        }

        void easySwitchDispatch(loadSyncList());
        void easySwitchDispatch(loadImporters());

        // The mobile flow has no upsell modal
        trackAccountImportBYOEFinished({
            hasImportEmails: importEmails,
            importPeriod,
            isUpsellShown: false,
            isClaimedAddress,
        });

        return { status: 'success', address: finalized.address, importEmails };
    };

    const connectBYOEAddress = async ({
        token,
        importEmails,
        importPeriod,
    }: {
        token: ImportToken;
        importEmails: boolean;
        importPeriod?: TIME_PERIOD;
    }): Promise<ConnectBYOEAddressResult> => {
        if (!hasAccessToBYOE) {
            return fail({ type: 'no-access' });
        }

        // Stop if the address is already a BYOE address
        const existingAddress = findUserAddress(token.Account, addresses);
        if (existingAddress && getIsBYOEAddress(existingAddress)) {
            trackAccountImportBYOEError({ errorStep: 'address_already_connected' });
            return fail({ type: 'already-added' });
        }

        // The backend also tells us here if the address belongs to another account
        const importTask = await startImportTask({ account: token.Account, importEmails, importPeriod });
        if (importTask.status === 'failure') {
            trackImportTaskFailure(importTask.reason);
            return importTask;
        }

        // Intended order, as in the old hook: a failure here leaves the import task already started
        return completeConnection({
            existingAddress,
            account: token.Account,
            importEmails,
            importPeriod,
            isClaimedAddress: false,
        });
    };

    /**
     * Connects an address that is used on another account, once the user confirmed the claim.
     * Takes the data of the `claimable-address` failure, so the UI only has to hand it back.
     */
    const claimBYOEAddress = async ({
        email,
        importEmails,
        importPeriod,
    }: {
        email: string;
        importEmails: boolean;
        importPeriod?: TIME_PERIOD;
    }): Promise<ConnectBYOEAddressResult> => {
        if (!hasAccessToBYOE) {
            return fail({ type: 'no-access' });
        }

        if (!canClaimExternalAddress) {
            return fail({ type: 'linked-to-another-account' });
        }

        const importTask = await startImportTask({
            account: email,
            importEmails,
            importPeriod,
            claimAddress: true,
        });
        if (importTask.status === 'failure') {
            trackImportTaskFailure(importTask.reason);
            return importTask;
        }

        // The claim succeeded, so finalizing is the only step left
        return completeConnection({
            existingAddress: findUserAddress(email, addresses),
            account: email,
            importEmails,
            importPeriod,
            isClaimedAddress: true,
        });
    };

    const connectBYOEAddressWithCode = async ({
        code,
        redirectUri,
        importEmails,
        importPeriod,
        expectedEmailAddress,
        onAccountResolved,
    }: {
        code: string;
        redirectUri: string;
        importEmails: boolean;
        importPeriod?: TIME_PERIOD;
        expectedEmailAddress?: string;
        /** Called with the connected email as soon as the code is exchanged, before the address is set up. */
        onAccountResolved?: (account: string) => void;
    }): Promise<ConnectBYOEAddressResult> => {
        const response = await easySwitchDispatch(
            createTokenItem({
                Code: code,
                Provider: OAUTH_PROVIDER.GOOGLE,
                RedirectUri: redirectUri,
                Source: source,
                Features: [EASY_SWITCH_FEATURES.BYOE],
                expectedEmailAddress,
                // The failure is returned to the caller, which decides what to show
                silent: true,
            })
        );

        if (response.meta.requestStatus === 'rejected') {
            const isWrongAccount = response.payload?.Error === WRONG_ACCOUNT_ERROR;
            trackAccountImportBYOEError({ errorStep: isWrongAccount ? 'wrong_account' : 'authentication' });
            return fail({ type: isWrongAccount ? 'wrong-account' : 'token-failed' });
        }

        trackAccountImportBYOEAuthenticated();

        onAccountResolved?.(response.payload.Account);

        return connectBYOEAddress({ token: response.payload, importEmails, importPeriod });
    };

    return {
        connectBYOEAddress,
        connectBYOEAddressWithCode,
        claimBYOEAddress,
    };
};
