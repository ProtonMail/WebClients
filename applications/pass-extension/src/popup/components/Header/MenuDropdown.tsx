import { type VFC, memo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { DropdownProps } from '@proton/components';
import {
    Dropdown,
    DropdownMenu,
    DropdownMenuButton,
    DropdownSizeUnit,
    Icon,
    usePopperAnchor,
} from '@proton/components';
import { detectBrowser, getWebStoreUrl } from '@proton/pass/extension/browser';
import {
    emptyTrashIntent,
    restoreTrashIntent,
    selectCanLockSession,
    selectPassPlan,
    selectPlanDisplayName,
    vaultDeleteIntent,
} from '@proton/pass/store';
import type { MaybeNull, VaultShare } from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { pipe, tap } from '@proton/pass/utils/fp';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { ConfirmationModal } from '../../../../src/shared/components/confirmation';
import { UpgradeButton } from '../../../shared/components/upgrade/UpgradeButton';
import { handleVaultDeletionEffects } from '../../context/items/ItemEffects';
import { useItemsFilteringContext } from '../../hooks/useItemsFilteringContext';
import { useNavigationContext } from '../../hooks/useNavigationContext';
import { useOpenSettingsTab } from '../../hooks/useOpenSettingsTab';
import { usePopupContext } from '../../hooks/usePopupContext';
import { VaultModal, type Props as VaultModalProps } from '../../views/Vault/Vault.modal';
import { VaultDeleteModal } from '../Vault/VaultDeleteModal';
import { VaultSubmenu } from './VaultSubmenu';

const DROPDOWN_SIZE: NonNullable<DropdownProps['size']> = {
    width: `20em`,
    height: DropdownSizeUnit.Dynamic,
    maxHeight: '380px',
};

const MenuDropdownRaw: VFC<{ className?: string }> = ({ className }) => {
    const { sync, lock, logout, ready } = usePopupContext();
    const { inTrash, unselectItem } = useNavigationContext();
    const { shareId, setSearch, setShareId, setShareBeingDeleted } = useItemsFilteringContext();

    const passPlan = useSelector(selectPassPlan);
    const planDisplayName = useSelector(selectPlanDisplayName);

    const openSettings = useOpenSettingsTab();
    const webStoreURL = getWebStoreUrl(detectBrowser());

    const dispatch = useDispatch();
    const canLock = useSelector(selectCanLockSession);
    const [deleteVault, setDeleteVault] = useState<MaybeNull<VaultShare>>(null);
    const [vaultModalProps, setVaultModalProps] = useState<MaybeNull<VaultModalProps>>(null);
    const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const withClose = <F extends (...args: any[]) => any>(cb: F) => pipe(cb, tap(close));

    const handleVaultDelete = (destinationShareId: MaybeNull<string>) => {
        if (deleteVault !== null) {
            handleVaultDeletionEffects(deleteVault.shareId, {
                shareId,
                setShareBeingDeleted,
                setShareId,
            });

            dispatch(
                vaultDeleteIntent({
                    id: deleteVault.shareId,
                    content: deleteVault.content,
                    destinationShareId,
                })
            );
        }
    };

    const handleRestoreTrash = () => dispatch(restoreTrashIntent());
    const handleDeleteAllItemsInTrash = () => dispatch(emptyTrashIntent());

    return (
        <>
            <nav className={className}>
                <Button
                    icon
                    shape="solid"
                    color="weak"
                    pill
                    ref={anchorRef}
                    onClick={toggle}
                    size="small"
                    title={isOpen ? c('Action').t`Close navigation` : c('Action').t`Open navigation`}
                >
                    <Icon name="hamburger" />
                </Button>

                <Dropdown
                    anchorRef={anchorRef}
                    isOpen={isOpen}
                    onClose={close}
                    originalPlacement="bottom"
                    autoClose={false}
                    size={DROPDOWN_SIZE}
                >
                    <DropdownMenu>
                        <div className="flex flex-align-items-center flex-justify-space-between py-2 px-4">
                            <span
                                className={clsx(
                                    'flex flex-align-items-center',
                                    passPlan === UserPassPlan.PLUS && 'ui-note'
                                )}
                            >
                                <Icon name="star" className="mr-3" color="var(--interaction-norm)" />
                                <span className="text-left">
                                    <div className="text-sm">{c('Label').t`Current plan`}</div>
                                    <div className="text-sm" style={{ color: 'var(--interaction-norm)' }}>
                                        {planDisplayName}
                                    </div>
                                </span>
                            </span>
                            {passPlan !== UserPassPlan.PLUS && <UpgradeButton />}
                        </div>

                        <hr className="dropdown-item-hr my-2 mx-4" aria-hidden="true" />

                        <VaultSubmenu
                            selectedShareId={shareId}
                            handleVaultSelectClick={withClose((vaultShareId) => {
                                unselectItem();
                                setShareId(vaultShareId);
                                setSearch('');
                            })}
                            handleVaultDeleteClick={setDeleteVault}
                            handleVaultEditClick={withClose((vault: VaultShare) =>
                                setVaultModalProps({ open: true, payload: { type: 'edit', vault } })
                            )}
                            handleVaultCreateClick={withClose(() =>
                                setVaultModalProps({ open: true, payload: { type: 'new' } })
                            )}
                            inTrash={inTrash}
                            handleRestoreTrash={handleRestoreTrash}
                            handleEmptyTrash={() => setDeleteAllConfirm(true)}
                        />

                        <hr className="dropdown-item-hr my-2 mx-4" aria-hidden="true" />

                        <DropdownMenuButton
                            className="flex flex-align-items-center flex-justify-space-between py-2 px-4"
                            onClick={() => openSettings()}
                        >
                            <span className="flex flex-align-items-center">
                                <Icon name="cog-wheel" className="mr-3 color-weak" />
                                {c('Label').t`Settings`}
                            </span>

                            <Icon name="arrow-out-square" className="ml-3 color-weak" />
                        </DropdownMenuButton>

                        <hr className="dropdown-item-hr my-2 mx-4" aria-hidden="true" />

                        {webStoreURL && (
                            <DropdownMenuButton
                                className="flex flex-align-items-center flex-justify-space-between py-2 px-4"
                                onClick={() => window.open(webStoreURL, '_blank')}
                            >
                                <span className="flex flex-align-items-center">
                                    <Icon name="star" className="mr-3 color-weak" />
                                    {c('Action').t`Rate Pass`}
                                </span>

                                <Icon name="arrow-out-square" className="ml-3 color-weak" />
                            </DropdownMenuButton>
                        )}

                        <DropdownMenuButton
                            className="flex flex-align-items-center py-2 px-4"
                            onClick={() => openSettings('support')}
                        >
                            <Icon name="bug" className="mr-3 color-weak" />
                            {c('Action').t`Report a problem`}
                        </DropdownMenuButton>

                        <DropdownMenuButton
                            className="flex flex-align-items-center py-2 px-4"
                            onClick={withClose(sync)}
                            disabled={!ready}
                        >
                            <Icon name="arrow-rotate-right" className="mr-3 color-weak" />
                            {c('Action').t`Sync`}
                        </DropdownMenuButton>

                        {canLock && (
                            <DropdownMenuButton
                                className="flex flex-align-items-center py-2 px-4"
                                onClick={withClose(lock)}
                                disabled={!ready}
                            >
                                <Icon name="lock" className="mr-3 color-weak" />
                                {c('Action').t`Lock ${PASS_APP_NAME}`}
                            </DropdownMenuButton>
                        )}

                        <DropdownMenuButton
                            className="flex flex-align-items-center py-2 px-4"
                            onClick={() => logout({ soft: false })}
                        >
                            <Icon name="arrow-out-from-rectangle" className="mr-3 color-weak" />
                            {c('Action').t`Sign out`}
                        </DropdownMenuButton>
                    </DropdownMenu>
                </Dropdown>
            </nav>

            {vaultModalProps !== null && <VaultModal {...vaultModalProps} onClose={() => setVaultModalProps(null)} />}

            <VaultDeleteModal
                vault={deleteVault}
                open={deleteVault !== null}
                onClose={() => setDeleteVault(null)}
                onSubmit={handleVaultDelete}
            />

            <ConfirmationModal
                title={c('Title').t`Permanently remove all items ?`}
                open={deleteAllConfirm}
                onClose={() => setDeleteAllConfirm(false)}
                onSubmit={handleDeleteAllItemsInTrash}
                alertText={c('Warning')
                    .t`All your trashed items will be permanently deleted. You can not undo this action.`}
                submitText={c('Action').t`Delete all`}
            />
        </>
    );
};

export const MenuDropdown = memo(MenuDropdownRaw);
