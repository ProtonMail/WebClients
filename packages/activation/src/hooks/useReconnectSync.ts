import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import type { WithLoading } from '@proton/hooks/useLoading';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import { getIsBYOEAccount } from '@proton/shared/lib/keys/accountType';

import { getTokensByFeature } from '../api/api';
import type { ReconnectBYOEAddressResult } from '../byoe/reconnectBYOEAddress.interface';
import { useReconnectBYOEAddress } from '../byoe/useReconnectBYOEAddress';
import { getBYOEDisabledNotification } from '../constants';
import { getBYOEAddressLimit } from '../helpers/byoeAddresses';
import {
    EASY_SWITCH_FEATURES,
    EASY_SWITCH_SOURCES,
    type ImportToken,
    OAUTH_PROVIDER,
    type OAuthProps,
} from '../interface';
import { useEasySwitchDispatch, useEasySwitchSelector } from '../logic/store';
import { SyncTokenStrategy, createSyncItem, resumeSyncItem } from '../logic/sync/sync.actions';
import { selectSyncByEmail } from '../logic/sync/sync.selectors';
import useBYOEAddressesCounts from './useBYOEAddressesCounts';
import useOAuthPopup from './useOAuthPopup';

const useReconnectSync = (address: Address) => {
    const api = useApi();
    const [user] = useUser();
    const easySwitchDispatch = useEasySwitchDispatch();
    const { createNotification } = useNotifications();

    const { activeBYOEAddresses } = useBYOEAddressesCounts();
    const { getExistingToken, reconnectWithToken, reconnectWithCode } = useReconnectBYOEAddress({
        source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_RECONNECT_BYOE,
    });

    const sync = useEasySwitchSelector((state) => selectSyncByEmail(state, address.Email));

    const { triggerOAuthPopup, loadingConfig } = useOAuthPopup({
        errorMessage: c('Error').t`Your forward will not be processed.`,
    });

    // Used to reconnect after losing a sync. We need to resume the sync.
    const handleGrantPermission = async (withLoading: WithLoading, address: Address) => {
        const features = [getIsBYOEAccount(user) ? EASY_SWITCH_FEATURES.BYOE : EASY_SWITCH_FEATURES.IMPORT_MAIL];
        const { Tokens } = await api<{ Tokens: ImportToken[] }>(
            getTokensByFeature({
                Account: sync?.account || address.Email,
                Features: features,
                Provider: OAUTH_PROVIDER.GOOGLE,
            })
        );

        // It's possible that the sync has been lost, and deleted backend side (after some time they are deleted)
        // In that case the user has to re-create a sync.
        if (!sync) {
            if (Tokens.length > 0) {
                await withLoading(async () => {
                    await easySwitchDispatch(
                        createSyncItem({
                            type: SyncTokenStrategy.useExisting,
                            token: Tokens[0],
                            Source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_GRANT_PERMISSION_BYOE,
                            expectedEmailAddress: address.Email,
                            successNotification: { text: c('action').t`Resuming forward` },
                        })
                    );
                });

                return;
            }

            void triggerOAuthPopup({
                provider: OAUTH_PROVIDER.GOOGLE,
                features,
                callback: async (oAuthProps: OAuthProps) => {
                    const { Code, Provider, RedirectUri } = oAuthProps;
                    await withLoading(async () => {
                        await easySwitchDispatch(
                            createSyncItem({
                                type: SyncTokenStrategy.create,
                                Code,
                                Provider,
                                RedirectUri,
                                Source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_GRANT_PERMISSION_BYOE,
                                expectedEmailAddress: address.Email,
                                successNotification: { text: c('action').t`Resuming forward` },
                                Features: [EASY_SWITCH_FEATURES.BYOE],
                            })
                        );
                    });
                },
            });

            return;
        }

        if (Tokens.length > 0) {
            void withLoading(
                easySwitchDispatch(
                    resumeSyncItem({
                        type: SyncTokenStrategy.useExisting,
                        token: Tokens[0],
                        successNotification: { text: c('action').t`Resuming forward` },
                        syncId: sync.id,
                        importerId: sync.importerID,
                    })
                )
            );
        } else {
            void triggerOAuthPopup({
                provider: OAUTH_PROVIDER.GOOGLE,
                features,
                callback: async (oAuthProps: OAuthProps) => {
                    const { Code, Provider, RedirectUri } = oAuthProps;

                    void withLoading(
                        easySwitchDispatch(
                            resumeSyncItem({
                                type: SyncTokenStrategy.create,
                                Code,
                                Provider,
                                RedirectUri,
                                Source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_GRANT_PERMISSION_BYOE,
                                successNotification: { text: c('action').t`Resuming forward` },
                                syncId: sync.id,
                                importerId: sync.importerID,
                                Features: [EASY_SWITCH_FEATURES.BYOE],
                            })
                        )
                    );
                },
            });
        }
    };

    // The hook only returns what happened, showing it to the user is up to this caller.
    // A failed sync already told the user why (wrong Gmail account, API error), so only the other cases speak here.
    const notifyReconnectResult = (result: ReconnectBYOEAddressResult) => {
        if (result.status === 'success') {
            createNotification({ text: c('Notification').t`Address reconnected.` });
        } else if (result.reason.type === 'no-access') {
            createNotification(getBYOEDisabledNotification());
        } else if (result.reason.type === 'unknown' && result.reason.message) {
            createNotification({ type: 'error', text: result.reason.message });
        }
    };

    // Used to reconnect a manually disconnected address. We need to set the address flags and to create the sync again
    const handleReconnect = async ({
        withLoading,
        address,
        setLimitModalOpen,
        setUpsellModalOpen,
    }: {
        withLoading: WithLoading;
        address: Address;
        setUpsellModalOpen: (open: boolean) => void;
        setLimitModalOpen: (open: boolean) => void;
    }) => {
        // Prevent user from reconnecting manually disconnected address if the BYOE limit has been reached
        const limit = getBYOEAddressLimit(user, activeBYOEAddresses.length);
        if (limit === 'free-limit') {
            setUpsellModalOpen(true);
            return;
        } else if (limit === 'paid-limit') {
            setLimitModalOpen(true);
            return;
        }

        const token = await getExistingToken(address);

        if (token) {
            await withLoading(async () => notifyReconnectResult(await reconnectWithToken(address, token)));
        } else {
            void triggerOAuthPopup({
                provider: OAUTH_PROVIDER.GOOGLE,
                features: [EASY_SWITCH_FEATURES.BYOE],
                callback: async ({ Code, RedirectUri }: OAuthProps) => {
                    await withLoading(async () =>
                        notifyReconnectResult(
                            await reconnectWithCode(address, { code: Code, redirectUri: RedirectUri })
                        )
                    );
                },
            });
        }
    };

    return {
        loadingConfig,
        sync,
        handleGrantPermission,
        handleReconnect,
    };
};

export default useReconnectSync;
