import { c } from 'ttag';

import { updateBYOEAddressConnection } from '@proton/account/addressKeys/actions';
import { useUser } from '@proton/account/user/hooks';
import useOAuthPopup from '@proton/activation/src/hooks/useOAuthPopup';
import {
    EASY_SWITCH_FEATURES,
    EASY_SWITCH_SOURCES,
    type ImportToken,
    OAUTH_PROVIDER,
    type OAuthProps,
} from '@proton/activation/src/interface';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { SyncTokenStrategy, createSyncItem, resumeSyncItem } from '@proton/activation/src/logic/sync/sync.actions';
import { selectSyncByEmail } from '@proton/activation/src/logic/sync/sync.selectors';
import { useApi, useNotifications } from '@proton/components';
import type { WithLoading } from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store';
import type { Address } from '@proton/shared/lib/interfaces';
import { getIsBYOEAccount } from '@proton/shared/lib/keys';
import { hasPaidMail } from '@proton/shared/lib/user/helpers';

import { getTokensByFeature } from '../api';
import { MAX_SYNC_FREE_USER, MAX_SYNC_PAID_USER } from '../constants';
import useBYOEAddressesCounts from './useBYOEAddressesCounts';

const useReconnectSync = (address: Address) => {
    const api = useApi();
    const [user] = useUser();
    const easySwitchDispatch = useEasySwitchDispatch();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();

    const { addressesOrSyncs } = useBYOEAddressesCounts();

    const sync = useEasySwitchSelector((state) => selectSyncByEmail(state, address.Email));

    const { triggerOAuthPopup, loadingConfig } = useOAuthPopup({
        errorMessage: c('Error').t`Your forward will not be processed.`,
    });

    // Used to reconnect after losing a sync. We need to resume the sync.
    const handleGrantPermission = async (withLoading: WithLoading) => {
        if (!sync) {
            return;
        }

        const features = [getIsBYOEAccount(user) ? EASY_SWITCH_FEATURES.BYOE : EASY_SWITCH_FEATURES.IMPORT_MAIL];
        const { Tokens } = await api<{ Tokens: ImportToken[] }>(
            getTokensByFeature({
                Account: sync.account,
                Features: features,
                Provider: OAUTH_PROVIDER.GOOGLE,
            })
        );

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
                // We don't know if the sync is a forwarding or a BYOE, so we want to reconnect the user using the full scope for now
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
                            })
                        )
                    );
                },
            });
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
        if (!hasPaidMail(user) && addressesOrSyncs.length >= MAX_SYNC_FREE_USER) {
            setUpsellModalOpen(true);
            return;
        } else if (addressesOrSyncs.length >= MAX_SYNC_PAID_USER) {
            setLimitModalOpen(true);
            return;
        }

        const features = [EASY_SWITCH_FEATURES.BYOE];
        const { Tokens } = await api<{ Tokens: ImportToken[] }>(
            getTokensByFeature({
                Account: address.Email,
                Features: features,
                Provider: OAUTH_PROVIDER.GOOGLE,
            })
        );

        if (Tokens.length > 0) {
            await withLoading(async () => {
                const result = await easySwitchDispatch(
                    createSyncItem({
                        type: SyncTokenStrategy.useExisting,
                        token: Tokens[0],
                        Source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_RECONNECT_BYOE,
                        expectedEmailAddress: { address: address.Email, type: 'reconnect' },
                    })
                );

                // Do not change the address flags if creating the sync failed (e.g. user logged with the wrong google account)
                if (result.type.endsWith('rejected')) {
                    return;
                }

                await dispatch(updateBYOEAddressConnection({ address, type: 'reconnect' }));

                createNotification({text: c('Notification').t`Address reconnected.`});
            });
        } else {
            void triggerOAuthPopup({
                provider: OAUTH_PROVIDER.GOOGLE,
                features,
                callback: async (oAuthProps: OAuthProps) => {
                    const { Code, Provider, RedirectUri } = oAuthProps;
                    await withLoading(async () => {
                        const result = await easySwitchDispatch(
                            createSyncItem({
                                type: SyncTokenStrategy.create,
                                Code,
                                Provider,
                                RedirectUri,
                                Source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_RECONNECT_BYOE,
                                expectedEmailAddress: { address: address.Email, type: 'reconnect' },
                            })
                        );

                        // Do not change the address flags if creating the sync failed (e.g. user logged with the wrong google account)
                        if (result.type.endsWith('rejected')) {
                            return;
                        }

                        await dispatch(updateBYOEAddressConnection({ address, type: 'reconnect' }));

                        createNotification({text: c('Notification').t`Address reconnected.`})
                    });
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
