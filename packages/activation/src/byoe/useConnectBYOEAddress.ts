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
import { createTokenItem, loadSyncList } from '../logic/sync/sync.actions';
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
        token,
        importEmails,
        importPeriod,
    }: {
        token: ImportToken;
        importEmails: boolean;
        importPeriod?: TIME_PERIOD;
    }): Promise<StartImportTaskResult> => {
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
            return { status: 'started' };
        } catch (error) {
            const { code } = getApiError(error);
            if (code === BYOE_ADDRESS_ERROR.ADDRESS_ALREADY_EXISTS) {
                const canBeClaimed = await canAddressBeClaimed(token.Account);
                if (canBeClaimed) {
                    return fail({ type: 'claimable-address', email: token.Account, importEmails, importPeriod });
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
            return fail({ type: 'already-added' });
        }

        // The backend also tells us here if the address belongs to another account
        const importTask = await startImportTask({ token, importEmails, importPeriod });
        if (importTask.status === 'failure') {
            return importTask;
        }

        // Finalize the address migration to BYOE
        const finalized = await finalizeAddress(existingAddress, token.Account);
        if (finalized.status === 'failure') {
            return finalized;
        }
        // Convert or create returned no address
        if (!finalized.address) {
            return fail({ type: 'unknown' });
        }

        void easySwitchDispatch(loadSyncList());
        void easySwitchDispatch(loadImporters());

        return { status: 'success', address: finalized.address, importEmails };
    };

    const connectBYOEAddressWithCode = async ({
        code,
        redirectUri,
        importEmails,
        importPeriod,
        expectedEmailAddress,
    }: {
        code: string;
        redirectUri: string;
        importEmails: boolean;
        importPeriod?: TIME_PERIOD;
        expectedEmailAddress?: string;
    }): Promise<ConnectBYOEAddressResult> => {
        const response = await easySwitchDispatch(
            createTokenItem({
                Code: code,
                Provider: OAUTH_PROVIDER.GOOGLE,
                RedirectUri: redirectUri,
                Source: source,
                Features: [EASY_SWITCH_FEATURES.BYOE],
                expectedEmailAddress,
            })
        );

        if (response.type.endsWith('rejected')) {
            const isWrongAccount = (response.payload as { Error?: string } | undefined)?.Error === 'wrong_account';
            return fail({ type: isWrongAccount ? 'wrong-account' : 'token-failed' });
        }

        return connectBYOEAddress({ token: response.payload, importEmails, importPeriod });
    };

    return {
        connectBYOEAddress,
        connectBYOEAddressWithCode,
    };
};
