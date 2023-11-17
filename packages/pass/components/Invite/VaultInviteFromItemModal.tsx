import { type VFC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import type { ModalProps } from '@proton/components/components';
import { ModalTwo, ModalTwoFooter, ModalTwoHeader } from '@proton/components/components';
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

export const VaultInviteFromItemModal: VFC<Props> = ({
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
        <ModalTwo size="small" enableCloseWhenClickOutside onClose={onClose} {...props}>
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
                        <span className="flex flex-item-noshrink text-no-wrap">{c('Action').t`Share this vault`}</span>
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
                            iconSize={20}
                        />
                    </div>
                </Button>

                {hasWritableSharedVaults && (
                    <Button pill size="large" shape="solid" color="norm" onClick={handleMoveToSharedVaultClick}>
                        {c('Action').t`Move to a shared vault`}
                    </Button>
                )}

                {!vaultLimitReached && (
                    <Button
                        pill
                        size="large"
                        shape="solid"
                        color={hasWritableSharedVaults ? 'weak' : 'norm'}
                        onClick={handleCreateSharedVaultClick}
                    >
                        {c('Action').t`Create a new vault to share`}
                    </Button>
                )}
            </ModalTwoFooter>
        </ModalTwo>
    );
};
