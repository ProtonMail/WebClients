import { c } from 'ttag';

import { ApiSyncState } from '@proton/activation/src/api/api.interface';
import { SYNC_G_OAUTH_SCOPES } from '@proton/activation/src/constants';
import useOAuthPopup from '@proton/activation/src/hooks/useOAuthPopup';
import type { EasySwitchFeatureFlag, OAuthProps } from '@proton/activation/src/interface';
import { EASY_SWITCH_SOURCES, ImportProvider } from '@proton/activation/src/interface';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { deleteSyncItem, resumeSyncItem } from '@proton/activation/src/logic/sync/sync.actions';
import { selectSyncById } from '@proton/activation/src/logic/sync/sync.selectors';
import { Button } from '@proton/atoms';
import { Alert, DropdownActions, FeatureCode, Prompt, useModalState } from '@proton/components';
import { useFeature } from '@proton/components/hooks';
import { useLoading } from '@proton/hooks';

interface Props {
    syncId: string;
}

const SyncRowActions = ({ syncId }: Props) => {
    const dispatch = useEasySwitchDispatch();

    const syncItem = useEasySwitchSelector((state) => selectSyncById(state, syncId));

    const [deleteModalProps, showDeleteModal, renderDeleteModal] = useModalState();

    const [loadingApiChange, withLoadingApiChange] = useLoading();

    const { triggerOAuthPopup, loadingConfig } = useOAuthPopup({
        errorMessage: c('Error').t`Your forward will not be processed.`,
    });

    const { feature } = useFeature<EasySwitchFeatureFlag>(FeatureCode.EasySwitch);

    const handleReconnectClick = () => {
        triggerOAuthPopup({
            provider: ImportProvider.GOOGLE,
            scope: SYNC_G_OAUTH_SCOPES.join(' '),
            callback: async (oAuthProps: OAuthProps) => {
                const { Code, Provider, RedirectUri } = oAuthProps;

                void withLoadingApiChange(
                    dispatch(
                        resumeSyncItem({
                            Code,
                            Provider,
                            RedirectUri,
                            Source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_RECONNECT_SYNC,
                            notification: { text: c('action').t`Resuming forward` },
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

        if (feature?.Value.GoogleMailSync) {
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
