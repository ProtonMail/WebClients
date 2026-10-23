import { useApi } from '@proton/app-context/useApi';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import { tracker } from '@proton/telemetry-tracker/lib/tracker';

import { getTokensByFeature } from '../api/api';
import useBYOEFeatureStatus from '../hooks/useBYOEFeatureStatus';
import { EASY_SWITCH_FEATURES, type EASY_SWITCH_SOURCES, type ImportToken, OAUTH_PROVIDER } from '../interface';
import { useEasySwitchDispatch } from '../logic/store';
import type { CreateSyncProps } from '../logic/sync/sync.actions';
import {
    SyncTokenStrategy,
    WRONG_ACCOUNT_ERROR,
    createSyncItem,
    deleteSyncItem,
    loadSyncList,
} from '../logic/sync/sync.actions';
import { BYOEAddressAction } from '../telemetry/events';
import { updateBYOEAddressConnection } from '../thunks/updateBYOEAddressConnection';
import type { ReconnectBYOEAddressFailure, ReconnectBYOEAddressResult } from './reconnectBYOEAddress.interface';

const fail = (reason: ReconnectBYOEAddressFailure): ReconnectBYOEAddressResult => {
    return { status: 'failure', reason };
};

type SharedSyncProps = Pick<CreateSyncProps, 'Source' | 'expectedEmailAddress' | 'Features'>;

/**
 * Reconnects a BYOE address the user disconnected. Business logic only: it never shows anything to the user,
 * the caller decides what to do with the result and with the way the Gmail permission is asked.
 *
 * The steps are the ones of `handleReconnect` in `useReconnectSync`: create the sync, and only once it exists turn the
 * address flags back on. Nothing is imported, the address already has its messages.
 */
export const useReconnectBYOEAddress = ({ source }: { source: EASY_SWITCH_SOURCES }) => {
    const api = useApi();
    const dispatch = useDispatch();
    const easySwitchDispatch = useEasySwitchDispatch();
    const [hasAccessToBYOE] = useBYOEFeatureStatus();

    /** The Gmail token the user already granted for this address, if any. Reconnecting then needs no OAuth. */
    const getExistingToken = async (address: Address): Promise<ImportToken | undefined> => {
        const { Tokens } = await api<{ Tokens: ImportToken[] }>(
            getTokensByFeature({
                Account: address.Email,
                Features: [EASY_SWITCH_FEATURES.BYOE],
                Provider: OAUTH_PROVIDER.GOOGLE,
            })
        );
        return Tokens[0];
    };

    const reconnect = async (address: Address, syncProps: CreateSyncProps): Promise<ReconnectBYOEAddressResult> => {
        if (!hasAccessToBYOE) {
            return fail({ type: 'no-access' });
        }

        const syncResult = await easySwitchDispatch(createSyncItem(syncProps));

        // Do not change the address flags if creating the sync failed (e.g. user logged with the wrong google account)
        if (createSyncItem.rejected.match(syncResult)) {
            // Other sync errors are API errors, already shown by the global handler: callers must not show them again
            return fail(
                syncResult.payload?.Error === WRONG_ACCOUNT_ERROR ? { type: 'wrong-account' } : { type: 'sync-failed' }
            );
        }

        try {
            await dispatch(updateBYOEAddressConnection({ address, type: 'reconnect' }));
        } catch (error) {
            // Don't leave a sync behind for an address that stays disconnected
            await easySwitchDispatch(deleteSyncItem({ syncId: syncResult.payload.sync.id, showNotification: false }));
            return fail({ type: 'unknown', message: getApiErrorMessage(error) });
        }

        tracker.emit(BYOEAddressAction, { dimensions: { addressAction: 'reconnect', provider: 'google' } });
        void easySwitchDispatch(loadSyncList());

        return { status: 'success', address };
    };

    const sharedSyncProps = (address: Address): SharedSyncProps => ({
        Source: source,
        // The Gmail account must be the one of the address, not any other one the user is signed in with
        expectedEmailAddress: address.Email,
        Features: [EASY_SWITCH_FEATURES.BYOE],
    });

    const reconnectWithToken = (address: Address, token: ImportToken) => {
        return reconnect(address, { type: SyncTokenStrategy.useExisting, token, ...sharedSyncProps(address) });
    };

    const reconnectWithCode = (address: Address, { code, redirectUri }: { code: string; redirectUri: string }) => {
        return reconnect(address, {
            type: SyncTokenStrategy.create,
            Code: code,
            Provider: OAUTH_PROVIDER.GOOGLE,
            RedirectUri: redirectUri,
            ...sharedSyncProps(address),
        });
    };

    return { getExistingToken, reconnectWithToken, reconnectWithCode };
};
