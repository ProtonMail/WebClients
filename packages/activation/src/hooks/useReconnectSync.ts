import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import useOAuthPopup from '@proton/activation/src/hooks/useOAuthPopup';
import {
    EASY_SWITCH_FEATURES,
    EASY_SWITCH_SOURCES,
    OAUTH_PROVIDER,
    type OAuthProps,
} from '@proton/activation/src/interface';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { resumeSyncItem } from '@proton/activation/src/logic/sync/sync.actions';
import { selectSyncByEmail } from '@proton/activation/src/logic/sync/sync.selectors';
import { type WithLoading } from '@proton/hooks/useLoading';
import { type Address } from '@proton/shared/lib/interfaces';
import { getIsBYOEAccount } from '@proton/shared/lib/keys';

const useReconnectSync = (address: Address) => {
    const [user] = useUser();
    const easySwitchDispatch = useEasySwitchDispatch();

    const sync = useEasySwitchSelector((state) => selectSyncByEmail(state, address.Email));

    const { triggerOAuthPopup, loadingConfig } = useOAuthPopup({
        errorMessage: c('Error').t`Your forward will not be processed.`,
    });

    const handleReconnect = (withLoading: WithLoading) => {
        if (!sync) {
            return;
        }

        void triggerOAuthPopup({
            provider: OAUTH_PROVIDER.GOOGLE,
            // We don't know if the sync is a forwarding or a BYOE, so we want to reconnect the user using the full scope for now
            features: [getIsBYOEAccount(user) ? EASY_SWITCH_FEATURES.BYOE : EASY_SWITCH_FEATURES.IMPORT_MAIL],
            callback: async (oAuthProps: OAuthProps) => {
                const { Code, Provider, RedirectUri } = oAuthProps;

                void withLoading(
                    easySwitchDispatch(
                        resumeSyncItem({
                            Code,
                            Provider,
                            RedirectUri,
                            Source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_RECONNECT_SYNC,
                            successNotification: { text: c('action').t`Resuming forward` },
                            syncId: sync.id,
                            importerId: sync.importerID,
                        })
                    )
                );
            },
        });
    };

    return {
        loadingConfig,
        sync,
        handleReconnect,
    };
};

export default useReconnectSync;
