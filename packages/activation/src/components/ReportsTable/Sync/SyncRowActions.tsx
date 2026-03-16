import { c } from 'ttag';

import { ApiSyncState } from '@proton/activation/src/api/api.interface';
import useOAuthPopup from '@proton/activation/src/hooks/useOAuthPopup';
import type { ImportToken, OAuthProps } from '@proton/activation/src/interface';
import { EASY_SWITCH_FEATURES, EASY_SWITCH_SOURCES, OAUTH_PROVIDER } from '@proton/activation/src/interface';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { SyncTokenStrategy, deleteSyncItem, resumeSyncItem } from '@proton/activation/src/logic/sync/sync.actions';
import { selectSyncById } from '@proton/activation/src/logic/sync/sync.selectors';
import { Button } from '@proton/atoms/Button/Button';
import { Prompt, useApi, useModalState } from '@proton/components';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import { useLoading } from '@proton/hooks';
import { IcThreeDotsVertical } from '@proton/icons/icons/IcThreeDotsVertical';
import { IcTrash } from '@proton/icons/icons/IcTrash';

import { getTokensByFeature } from '../../../api';

interface Props {
    syncId: string;
}

const SyncRowActions = ({ syncId }: Props) => {
    const api = useApi();
    const dispatch = useEasySwitchDispatch();
    const { anchorRef, isOpen, close, toggle } = usePopperAnchor<HTMLButtonElement>();

    const syncItem = useEasySwitchSelector((state) => selectSyncById(state, syncId));

    const [deleteModalProps, showDeleteModal, renderDeleteModal] = useModalState();

    const [loadingApiChange, withLoadingApiChange] = useLoading();

    const { triggerOAuthPopup, loadingConfig } = useOAuthPopup({
        errorMessage: c('Error').t`Your forward will not be processed.`,
    });

    const handleReconnectClick = async () => {
        const features = [EASY_SWITCH_FEATURES.IMPORT_MAIL];

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
        showDeleteModal(true);
    };

    const handleDeleteSync = () => {
        void withLoadingApiChange(dispatch(deleteSyncItem({ syncId })));
        showDeleteModal(false);
    };

    return (
        <>
            {syncItem.state === ApiSyncState.ACTIVE ? (
                <Button
                    onClick={handleClickDelete}
                    loading={loadingApiChange}
                    data-testid="ReportsTable:deleteForward"
                    shape="ghost"
                    icon
                >
                    <IcTrash alt={c('Action').t`Delete forward`} />
                </Button>
            ) : (
                <>
                    <Button onClick={toggle} ref={anchorRef} loading={loadingConfig} icon shape="ghost">
                        <IcThreeDotsVertical alt={c('Action').t`More options`} />
                    </Button>

                    <Dropdown anchorRef={anchorRef} isOpen={isOpen} onClose={close} originalPlacement="top-start">
                        <DropdownMenu>
                            <DropdownMenuButton onClick={handleReconnectClick}>
                                {c('Action').t`Reconnect`}
                            </DropdownMenuButton>
                            <DropdownMenuButton onClick={handleClickDelete}>
                                {c('Action').t`Delete forward`}
                            </DropdownMenuButton>
                        </DropdownMenu>
                    </Dropdown>
                </>
            )}

            {renderDeleteModal && (
                <Prompt
                    title={c('Action').t`Remove forward`}
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
                    {c('account').t`You will stop the mail forwarding.`}
                </Prompt>
            )}
        </>
    );
};

export default SyncRowActions;
