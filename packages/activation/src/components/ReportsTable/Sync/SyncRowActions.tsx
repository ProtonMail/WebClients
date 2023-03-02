import { c } from 'ttag';

import { ApiSyncState } from '@proton/activation/src/api/api.interface';
import { SYNC_G_OAUTH_SCOPES, SYNC_SOURCE } from '@proton/activation/src/constants';
import useOAuthPopup from '@proton/activation/src/hooks/useOAuthPopup';
import { EasySwitchFeatureFlag, ImportProvider, OAuthProps } from '@proton/activation/src/interface';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { deleteSyncItem, resumeSyncItem } from '@proton/activation/src/logic/sync/sync.actions';
import { selectSyncById } from '@proton/activation/src/logic/sync/sync.selectors';
import { Button } from '@proton/atoms/Button';
import { Alert, AlertModal, DropdownActions, useModalState } from '@proton/components/components';
import { FeatureCode } from '@proton/components/containers';
import { useFeature, useLoading } from '@proton/components/hooks';

interface Props {
    syncId: string;
}

const SyncRowActions = ({ syncId }: Props) => {
    const dispatch = useEasySwitchDispatch();

    const syncItem = useEasySwitchSelector((state) => selectSyncById(state, syncId));

    const [deleteModalProps, showDeleteModal, renderDeleteModal] = useModalState();

    const [loadingApiChange, withLoadingApiChange] = useLoading();

    const { triggerOAuthPopup } = useOAuthPopup({
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
                            Source: SYNC_SOURCE,
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
                },
                deleteSyncButton,
            ];
        }

        //If gmail sync isn't available users can only delete sync
        return [deleteSyncButton];
    };

    const activeAction = [
        {
            text: c('account').t`Delete forward`,
            onClick: () => showDeleteModal(true),
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
                <AlertModal
                    title={c('account').t`Remove forward`}
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
                    <Alert className="mb1" type="error">
                        {c('account').t`You will stop the mail forwarding.`}
                    </Alert>
                </AlertModal>
            )}
        </>
    );
};

export default SyncRowActions;
