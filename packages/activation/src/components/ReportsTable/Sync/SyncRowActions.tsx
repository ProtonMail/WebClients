import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { ApiSyncState } from '@proton/activation/src/api/api.interface';
import useOAuthPopup from '@proton/activation/src/hooks/useOAuthPopup';
import type { EasySwitchFeatureFlag, OAuthProps } from '@proton/activation/src/interface';
import { EASY_SWITCH_FEATURES, EASY_SWITCH_SOURCES, OAUTH_PROVIDER } from '@proton/activation/src/interface';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { deleteSyncItem, resumeSyncItem } from '@proton/activation/src/logic/sync/sync.actions';
import { selectSyncById } from '@proton/activation/src/logic/sync/sync.selectors';
import { Button } from '@proton/atoms';
import { Alert, DropdownActions, Prompt, useModalState } from '@proton/components';
import { FeatureCode, useFeature } from '@proton/features';
import { useLoading } from '@proton/hooks';
import { getIsBYOEAccount } from '@proton/shared/lib/keys';

interface Props {
    syncId: string;
}

const SyncRowActions = ({ syncId }: Props) => {
    const [user] = useUser();
    const dispatch = useEasySwitchDispatch();

    const syncItem = useEasySwitchSelector((state) => selectSyncById(state, syncId));

    const [deleteModalProps, showDeleteModal, renderDeleteModal] = useModalState();

    const [loadingApiChange, withLoadingApiChange] = useLoading();

    const { triggerOAuthPopup, loadingConfig } = useOAuthPopup({
        errorMessage: c('Error').t`Your forward will not be processed.`,
    });

    const { feature } = useFeature<EasySwitchFeatureFlag>(FeatureCode.EasySwitch);

    const handleReconnectClick = () => {
        void triggerOAuthPopup({
            provider: OAUTH_PROVIDER.GOOGLE,
            // We don't know if the sync is a forwarding or a BYOE, so we want to reconnect the user using the full scope for now
            features: [getIsBYOEAccount(user) ? EASY_SWITCH_FEATURES.BYOE : EASY_SWITCH_FEATURES.IMPORT_MAIL],
            callback: async (oAuthProps: OAuthProps) => {
                const { Code, Provider, RedirectUri } = oAuthProps;

                void withLoadingApiChange(
                    dispatch(
                        resumeSyncItem({
                            Code,
                            Provider,
                            RedirectUri,
                            Source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_RECONNECT_SYNC,
                            successNotification: { text: c('action').t`Resuming forward` },
                            syncId,
                            importerId: syncItem.importerID,
                        })
                    )
                );
            },
        });
    };

    const getStoppedAction = () => {
        const deleteSyncButton = {
            text: c('account').t`Delete forward`,
            onClick: () => showDeleteModal(true),
        };

        if (feature?.Value?.GoogleMailSync) {
            return [
                {
                    text: c('account').t`Reconnect`,
                    onClick: handleReconnectClick,
                    disabled: loadingConfig,
                },
                deleteSyncButton,
            ];
        }

        // If gmail sync isn't available users can only delete sync
        return [deleteSyncButton];
    };

    const activeAction = [
        {
            text: c('account').t`Delete forward`,
            onClick: () => showDeleteModal(true),
            'data-testid': 'ReportsTable:deleteForward',
            loading: loadingApiChange,
        },
    ];

    const handleDeleteSync = () => {
        void withLoadingApiChange(dispatch(deleteSyncItem({ syncId })));
        showDeleteModal(false);
    };

    return (
        <>
            <DropdownActions
                loading={loadingApiChange}
                size="small"
                list={syncItem.state === ApiSyncState.ACTIVE ? activeAction : getStoppedAction()}
            />

            {renderDeleteModal && (
                <Prompt
                    title={c('account').t`Remove forward`}
                    data-testid="ReportsTable:deleteModal"
                    buttons={[
                        <Button color="danger" onClick={handleDeleteSync}>
                            {c('Action').t`Remove`}
                        </Button>,
                        <Button color="weak" onClick={() => showDeleteModal(false)}>
                            {c('Action').t`Keep`}
                        </Button>,
                    ]}
                    {...deleteModalProps}
                >
                    <Alert className="mb-4" type="error">
                        {c('account').t`You will stop the mail forwarding.`}
                    </Alert>
                </Prompt>
            )}
        </>
    );
};

export default SyncRowActions;
