import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { ApiSyncState } from '@proton/activation/src/api/api.interface';
import useOAuthPopup from '@proton/activation/src/hooks/useOAuthPopup';
import type { EasySwitchFeatureFlag, ImportToken, OAuthProps } from '@proton/activation/src/interface';
import { EASY_SWITCH_FEATURES, EASY_SWITCH_SOURCES, OAUTH_PROVIDER } from '@proton/activation/src/interface';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { SyncTokenStrategy, deleteSyncItem, resumeSyncItem } from '@proton/activation/src/logic/sync/sync.actions';
import { selectSyncById } from '@proton/activation/src/logic/sync/sync.selectors';
import { Button } from '@proton/atoms/Button/Button';
import { Alert, DropdownActions, Prompt, useApi, useModalState } from '@proton/components';
import { FeatureCode, useFeature } from '@proton/features';
import { useLoading } from '@proton/hooks';

import { getTokensByFeature } from '../../../api';
import DisconnectBYOEModal from '../../Modals/DisconnectBYOEModal/DisconnectBYOEModal';

interface Props {
    syncId: string;
}

const SyncRowActions = ({ syncId }: Props) => {
    const api = useApi();
    const [addresses = [], loadingAddresses] = useAddresses();
    const dispatch = useEasySwitchDispatch();

    const syncItem = useEasySwitchSelector((state) => selectSyncById(state, syncId));

    const [deleteModalProps, showDeleteModal, renderDeleteModal] = useModalState();
    const [disconnectBYOEProps, setDisconnectBYOEOpen, renderDisconnectBYOEModal] = useModalState();

    const addressWithSync = addresses.find((address) => address.Email === syncItem.account);

    const [loadingApiChange, withLoadingApiChange] = useLoading();

    const { triggerOAuthPopup, loadingConfig } = useOAuthPopup({
        errorMessage: c('Error').t`Your forward will not be processed.`,
    });

    const { feature } = useFeature<EasySwitchFeatureFlag>(FeatureCode.EasySwitch);

    const handleReconnectClick = async () => {
        const emailAddresses = addresses.map((address) => address.Email);
        const isBYOE = emailAddresses.includes(syncItem.account);
        const features = [isBYOE ? EASY_SWITCH_FEATURES.BYOE : EASY_SWITCH_FEATURES.IMPORT_MAIL];

        const { Tokens } = await api<{ Tokens: ImportToken[] }>(
            getTokensByFeature({
                Account: syncItem.account,
                Features: features,
                Provider: OAUTH_PROVIDER.GOOGLE,
            })
        );

        if (Tokens.length > 0) {
            void dispatch(
                resumeSyncItem({
                    type: SyncTokenStrategy.useExisting,
                    token: Tokens[0],
                    successNotification: { text: c('action').t`Resuming forward` },
                    syncId,
                    importerId: syncItem.importerID,
                })
            );
        } else {
            void triggerOAuthPopup({
                provider: OAUTH_PROVIDER.GOOGLE,
                features,
                callback: async (oAuthProps: OAuthProps) => {
                    const { Code, Provider, RedirectUri } = oAuthProps;

                    void withLoadingApiChange(
                        dispatch(
                            resumeSyncItem({
                                type: SyncTokenStrategy.create,
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
        }
    };

    const handleClickDelete = () => {
        if (addressWithSync) {
            setDisconnectBYOEOpen(true);
        } else {
            showDeleteModal(true);
        }
    };

    const getStoppedAction = () => {
        const deleteSyncButton = {
            text: c('account').t`Delete forward`,
            onClick: () => handleClickDelete(),
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
            onClick: () => handleClickDelete(),
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
                loading={loadingApiChange || loadingAddresses}
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

            {renderDisconnectBYOEModal && addressWithSync && (
                <DisconnectBYOEModal address={addressWithSync} {...disconnectBYOEProps} />
            )}
        </>
    );
};

export default SyncRowActions;
