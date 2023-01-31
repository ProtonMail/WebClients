import { c } from 'ttag';

import { ApiSyncState } from '@proton/activation/api/api.interface';
import { SYNC_G_OAUTH_SCOPES, SYNC_SOURCE } from '@proton/activation/constants';
import useOAuthPopup from '@proton/activation/hooks/useOAuthPopup';
import { OAUTH_PROVIDER, OAuthProps } from '@proton/activation/interface';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/logic/store';
import { deleteSyncItem, resumeSyncItem } from '@proton/activation/logic/sync/sync.actions';
import { selectSyncById } from '@proton/activation/logic/sync/sync.selectors';
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
        errorMessage: c('loc_nightly:Error').t`Your sync will not be processed.`,
    });

    const gmailSync = useFeature(FeatureCode.EasySwitchGmailSync);

    const handleReconnectClick = () => {
        triggerOAuthPopup({
            provider: OAUTH_PROVIDER.GOOGLE,
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
                            notification: { text: c('loc_nightly:Success').t`Resuming sync` },
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
            text: c('loc_nightly:account').t`Delete sync`,
            onClick: () => showDeleteModal(true),
        };

        if (gmailSync.feature?.Value) {
            return [
                {
                    text: c('loc_nightly:account').t`Reconnect`,
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
            text: c('loc_nightly:account').t`Delete sync`,
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
                    title="Remove the sync"
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
                        {c('loc_nightly:account').t`You will stop the syncing process.`}
                    </Alert>
                </AlertModal>
            )}
        </>
    );
};

export default SyncRowActions;
