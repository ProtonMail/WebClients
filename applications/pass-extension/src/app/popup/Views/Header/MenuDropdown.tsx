import { type VFC, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { handleVaultDeletionEffects } from 'proton-pass-extension/lib/components/Context/Items/ItemEffects';
import { useExpandPopup } from 'proton-pass-extension/lib/hooks/useExpandPopup';
import { useItemsFilteringContext } from 'proton-pass-extension/lib/hooks/useItemsFilteringContext';
import { useNavigationContext } from 'proton-pass-extension/lib/hooks/useNavigationContext';
import { useOpenSettingsTab } from 'proton-pass-extension/lib/hooks/useOpenSettingsTab';
import { usePopupContext } from 'proton-pass-extension/lib/hooks/usePopupContext';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { DropdownProps } from '@proton/components';
import { Dropdown, DropdownMenu, DropdownSizeUnit, Icon, usePopperAnchor } from '@proton/components';
import { ConfirmationModal } from '@proton/pass/components/Confirmation/ConfirmationModal';
import { useInviteContext } from '@proton/pass/components/Invite/InviteContextProvider';
import { UpgradeButton } from '@proton/pass/components/Layout/Button/UpgradeButton';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { Submenu, type SubmenuLinkItem } from '@proton/pass/components/Menu/Submenu';
import { VaultSubmenu } from '@proton/pass/components/Menu/Vault/VaultSubmenu';
import { usePasswordContext } from '@proton/pass/components/PasswordGenerator/PasswordContext';
import { VaultModal, type Props as VaultModalProps } from '@proton/pass/components/Vault/Vault.modal';
import { VaultDeleteModal } from '@proton/pass/components/Vault/VaultDeleteModal';
import { VaultIcon } from '@proton/pass/components/Vault/VaultIcon';
import { VaultMoveAllItemsConfirmation } from '@proton/pass/components/Vault/VaultMoveAllItemsConfirmation';
import { VaultSelectModal, useVaultSelectModalHandles } from '@proton/pass/components/Vault/VaultSelect.modal';
import { useActionRequest } from '@proton/pass/hooks/useActionRequest';
import { useConfirm } from '@proton/pass/hooks/useConfirm';
import {
    emptyTrashIntent,
    restoreTrashIntent,
    shareLeaveIntent,
    vaultDeleteIntent,
    vaultMoveAllItemsIntent,
} from '@proton/pass/store/actions';
import type { VaultShareItem } from '@proton/pass/store/reducers';
import {
    selectHasRegisteredLock,
    selectPassPlan,
    selectPlanDisplayName,
    selectShare,
    selectUser,
    selectWritableVaultsWithItemsCount,
} from '@proton/pass/store/selectors';
import type { MaybeNull, ShareType } from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { pipe, tap } from '@proton/pass/utils/fp/pipe';
import clsx from '@proton/utils/clsx';

const DROPDOWN_SIZE: NonNullable<DropdownProps['size']> = {
    width: `20em`,
    height: DropdownSizeUnit.Dynamic,
    maxHeight: '380px',
};

export const MenuDropdown: VFC = () => {
    const inviteContext = useInviteContext();
    const { sync, lock, logout, ready, expanded } = usePopupContext();
    const { inTrash, unselectItem } = useNavigationContext();
    const { shareId, setSearch, setShareId, setShareBeingDeleted } = useItemsFilteringContext();

    const [moveItemsFromVault, setMoveItemsFromVault] = useState<MaybeNull<VaultShareItem>>(null);
    const [moveItemsToShareId, setMoveItemsToShareId] = useState<MaybeNull<string>>(null);
    const [deleteVault, setDeleteVault] = useState<MaybeNull<VaultShareItem>>(null);
    const [vaultModalProps, setVaultModalProps] = useState<MaybeNull<VaultModalProps>>(null);

    const vault = useSelector(selectShare<ShareType.Vault>(shareId));
    const passPlan = useSelector(selectPassPlan);
    const planDisplayName = useSelector(selectPlanDisplayName);
    const user = useSelector(selectUser);
    const canLock = useSelector(selectHasRegisteredLock);

    const openSettings = useOpenSettingsTab();
    const dispatch = useDispatch();
    const expandPopup = useExpandPopup();
    const { closeVaultSelect, openVaultSelect, modalState } = useVaultSelectModalHandles();

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const withClose = <P extends any[], R extends any>(cb: (...args: P) => R) => pipe(cb, tap(close));

    const moveAllItems = useActionRequest({
        action: vaultMoveAllItemsIntent,
    });

    const handleVaultSelect = withClose((vaultShareId: MaybeNull<string>) => {
        unselectItem();
        setShareId(vaultShareId);
        setSearch('');
    });

    const handleVaultDelete = (vault: VaultShareItem, destinationShareId: MaybeNull<string>) => {
        handleVaultDeletionEffects(vault.shareId, { shareId, setShareBeingDeleted, setShareId });
        dispatch(vaultDeleteIntent({ shareId: vault.shareId, content: vault.content, destinationShareId }));
    };

    const handleVaultCreate = withClose(() =>
        setVaultModalProps({
            open: true,
            payload: { type: 'new', onVaultCreated: setShareId },
        })
    );

    const handleVaultEdit = (vault: VaultShareItem) =>
        setVaultModalProps({ open: true, payload: { type: 'edit', vault } });

    const handleVaultMoveAllItems = (vault: VaultShareItem) => {
        openVaultSelect(vault.shareId, selectWritableVaultsWithItemsCount);
        setMoveItemsFromVault(vault);
    };

    const handleSelectDestinationVault = (destinationShareId: string) => {
        setMoveItemsToShareId(destinationShareId);
        closeVaultSelect();
    };

    const handleVaultInvite = (vault: VaultShareItem) => inviteContext.createInvite({ vault });
    const handleVaultManage = withClose(({ shareId }: VaultShareItem) => inviteContext.manageAccess(shareId));
    const handleVaultLeave = useConfirm(({ shareId }: VaultShareItem) => dispatch(shareLeaveIntent({ shareId })));
    const handleTrashEmpty = useConfirm(() => dispatch(emptyTrashIntent()));
    const handleTrashRestore = () => dispatch(restoreTrashIntent());

    const handleVaultMoveAllItemsConfirm = () => {
        if (!(moveItemsFromVault && moveItemsToShareId)) return;
        moveAllItems.dispatch({
            shareId: moveItemsFromVault.shareId,
            vaultName: moveItemsFromVault.content.name,
            destinationShareId: moveItemsToShareId,
        });
        setMoveItemsFromVault(null);
        setMoveItemsToShareId(null);
    };

    const feedbackLinks: SubmenuLinkItem[] = [
        {
            icon: 'paper-plane',
            label: c('Action').t`Send us a message`,
            actionTab: () => openSettings('support'),
        },
        {
            url: 'https://twitter.com/Proton_Pass',
            icon: 'brand-twitter',
            label: c('Action').t`Write us on Twitter`,
        },
        {
            url: 'https://www.reddit.com/r/ProtonPass/',
            icon: 'brand-reddit',
            label: c('Action').t`Write us on Reddit`,
        },
        {
            url: 'https://github.com/ProtonMail/WebClients/tree/main/applications/pass-extension',
            icon: 'brand-github',
            label: c('Action').t`Help us improve`,
        },
        {
            url: 'https://protonmail.uservoice.com/forums/953584-proton-pass',
            icon: 'rocket',
            label: c('Action').t`Request a feature`,
        },
    ];

    const downloadLinks: SubmenuLinkItem[] = [
        {
            url: 'https://play.google.com/store/apps/details?id=proton.android.pass',
            icon: 'brand-android',
            label: c('Action').t`Pass for Android`,
        },
        {
            url: 'https://apps.apple.com/us/app/proton-pass-password-manager/id6443490629',
            icon: 'brand-apple',
            label: c('Action').t`Pass for iOS`,
        },
    ];

    const { openPasswordHistory } = usePasswordContext();

    const advancedLinks: SubmenuLinkItem[] = [
        {
            icon: 'key-history',
            label: c('Action').t`Generated passwords`,
            actionTab: withClose(openPasswordHistory),
        },
        {
            icon: 'arrow-rotate-right',
            label: c('Action').t`Manually sync your data`,
            actionTab: withClose(sync),
        },
    ];

    return (
        <>
            <nav>
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
                    <VaultIcon
                        className="flex-item-noshrink"
                        size={16}
                        color={vault?.content.display.color}
                        icon={vault?.content.display.icon}
                    />
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
                        <div className="flex flex-align-items-center flex-justify-space-between flex-nowrap gap-2 py-2 px-4">
                            <span
                                className={clsx(
                                    'flex flex-align-items-center flex-nowrap',
                                    passPlan === UserPassPlan.PLUS && 'ui-orange'
                                )}
                            >
                                <Icon name="star" className="mr-3" color="var(--interaction-norm)" />
                                <span className="text-left">
                                    <div className="text-sm text-ellipsis">{user?.Email}</div>
                                    <div className="text-sm" style={{ color: 'var(--interaction-norm)' }}>
                                        {planDisplayName}
                                    </div>
                                </span>
                            </span>
                            {passPlan !== UserPassPlan.PLUS && <UpgradeButton />}
                        </div>

                        <hr className="dropdown-item-hr my-2 mx-4" aria-hidden="true" />

                        <VaultSubmenu
                            inTrash={inTrash}
                            selectedShareId={shareId}
                            handleVaultSelect={handleVaultSelect}
                            handleVaultCreate={handleVaultCreate}
                            handleVaultEdit={handleVaultEdit}
                            handleVaultMoveAllItems={handleVaultMoveAllItems}
                            handleVaultDelete={setDeleteVault}
                            handleVaultInvite={handleVaultInvite}
                            handleVaultManage={handleVaultManage}
                            handleVaultLeave={handleVaultLeave.prompt}
                            handleTrashEmpty={handleTrashEmpty.prompt}
                            handleTrashRestore={handleTrashRestore}
                        />

                        <hr className="dropdown-item-hr my-2 mx-4" aria-hidden="true" />

                        <DropdownMenuButton
                            onClick={() => openSettings()}
                            label={c('Label').t`Settings`}
                            labelClassname="flex-item-fluid"
                            icon={'cog-wheel'}
                        />

                        {canLock && (
                            <DropdownMenuButton
                                onClick={withClose(lock)}
                                disabled={!ready}
                                label={c('Action').t`Lock extension`}
                                icon="lock"
                            />
                        )}

                        {!expanded && (
                            <DropdownMenuButton
                                onClick={expandPopup}
                                label={c('Action').t`Open in a window`}
                                icon="arrow-out-square"
                            />
                        )}

                        <Submenu
                            submenuIcon="notepad-checklist"
                            submenuLabel={c('Action').t`Advanced`}
                            linkItems={advancedLinks}
                        />

                        <hr className="dropdown-item-hr my-2 mx-4" aria-hidden="true" />

                        <Submenu submenuIcon="bug" submenuLabel={c('Action').t`Feedback`} linkItems={feedbackLinks} />
                        <Submenu
                            submenuIcon="mobile"
                            submenuLabel={c('Action').t`Get mobile apps`}
                            linkItems={downloadLinks}
                        />

                        <DropdownMenuButton
                            onClick={() => logout({ soft: false })}
                            label={c('Action').t`Sign out`}
                            icon="arrow-out-from-rectangle"
                        />
                    </DropdownMenu>
                </Dropdown>
            </nav>

            {vaultModalProps !== null && <VaultModal {...vaultModalProps} onClose={() => setVaultModalProps(null)} />}

            <VaultSelectModal
                downgradeMessage={c('Info')
                    .t`You have exceeded the number of vaults included in your subscription. Items can only be moved to your first two vaults. To move items between all vaults upgrade your subscription.`}
                onSubmit={handleSelectDestinationVault}
                onClose={closeVaultSelect}
                description="Select where you want to move all items"
                {...modalState}
            />

            <VaultMoveAllItemsConfirmation
                destinationShareId={moveItemsToShareId}
                onSubmit={handleVaultMoveAllItemsConfirm}
                onClose={() => setMoveItemsToShareId(null)}
                open={Boolean(moveItemsFromVault && moveItemsToShareId)}
            />

            <VaultDeleteModal vault={deleteVault} onClose={() => setDeleteVault(null)} onSubmit={handleVaultDelete} />

            <ConfirmationModal
                title={c('Title').t`Permanently remove all items ?`}
                open={handleTrashEmpty.pending}
                onClose={handleTrashEmpty.cancel}
                onSubmit={handleTrashEmpty.confirm}
                alertText={c('Warning')
                    .t`All your trashed items will be permanently deleted. You cannot undo this action.`}
                submitText={c('Action').t`Delete all`}
            />

            <ConfirmationModal
                title={c('Title').t`Leave vault ?`}
                open={handleVaultLeave.pending}
                onClose={handleVaultLeave.cancel}
                onSubmit={handleVaultLeave.confirm}
                alertText={c('Warning')
                    .t`You will no longer have access to this vault. To join it again, you will need a new invitation.`}
                submitText={c('Action').t`Leave`}
            />
        </>
    );
};
