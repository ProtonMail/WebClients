import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import type { ModalProps } from '@proton/components';
import { ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { VaultTag } from '@proton/pass/components/Vault/VaultTag';
import { VAULT_ICON_MAP } from '@proton/pass/components/Vault/constants';
import type { ShareItem } from '@proton/pass/store/reducers';
import { selectVaultLimits, selectWritableSharedVaults } from '@proton/pass/store/selectors';
import type { ShareType } from '@proton/pass/types';

export type Props = ModalProps & {
    handleCreateSharedVaultClick: () => void;
    handleMoveToSharedVaultClick: () => void;
    handleShareVaultClick: () => void;
    itemId: string;
    shareId: string;
    vault: ShareItem<ShareType.Vault>;
};

export const VaultInviteFromItemModal: FC<Props> = ({
    handleCreateSharedVaultClick,
    handleMoveToSharedVaultClick,
    handleShareVaultClick,
    onClose,
    itemId,
    shareId,
    vault,
    ...props
}) => {
    const hasWritableSharedVaults = useSelector(selectWritableSharedVaults).length > 0;
    const { vaultLimitReached } = useSelector(selectVaultLimits);

    return (
        <PassModal size="small" enableCloseWhenClickOutside onClose={onClose} {...props}>
            <ModalTwoHeader
                title={c('Action').t`Share`}
                subline={c('Info').t`Use vaults to share this item with others.`}
                className="text-center text-break-all"
                hasClose={false}
            />

            <ModalTwoFooter className="flex flex-column items-stretch text-center">
                <Button
                    pill
                    size="large"
                    shape="solid"
                    color="weak"
                    className="max-w-full"
                    onClick={handleShareVaultClick}
                >
                    <div className="flex justify-space-between items-center flex-nowrap max-w-full gap-4">
                        <span className="text-ellipsis text-no-wrap max-w-2/3">{c('Action').t`Share this vault`}</span>
                        <VaultTag
                            title={vault.content.name}
                            color={vault.content.display.color}
                            count={vault.targetMembers}
                            shared
                            icon={
                                vault.content.display.icon
                                    ? VAULT_ICON_MAP[vault.content.display.icon]
                                    : 'pass-all-vaults'
                            }
                            iconSize={5}
                        />
                    </div>
                </Button>

                {hasWritableSharedVaults && (
                    <Button
                        className="max-w-full"
                        color="norm"
                        onClick={handleMoveToSharedVaultClick}
                        pill
                        shape="solid"
                        size="large"
                    >
                        <span className="text-ellipsis">{c('Action').t`Move to a shared vault`}</span>
                    </Button>
                )}

                {!vaultLimitReached && (
                    <Button
                        className="max-w-full"
                        color={hasWritableSharedVaults ? 'weak' : 'norm'}
                        onClick={handleCreateSharedVaultClick}
                        pill
                        shape="solid"
                        size="large"
                    >
                        <span className="text-ellipsis">{c('Action').t`Create a new vault to share`}</span>
                    </Button>
                )}
            </ModalTwoFooter>
        </PassModal>
    );
};
