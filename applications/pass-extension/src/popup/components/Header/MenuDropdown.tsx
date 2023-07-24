import { type VFC, memo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { DropdownProps } from '@proton/components';
import { Dropdown, DropdownMenu, DropdownSizeUnit, Icon, usePopperAnchor } from '@proton/components';
import {
    emptyTrashIntent,
    restoreTrashIntent,
    selectHasRegisteredLock,
    selectPassPlan,
    selectPlanDisplayName,
    selectShare,
    selectUser,
    vaultDeleteIntent,
} from '@proton/pass/store';
import { type MaybeNull, ShareType, type VaultShare } from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { pipe, tap } from '@proton/pass/utils/fp';
import clsx from '@proton/utils/clsx';

import { ConfirmationModal } from '../../../../src/shared/components/confirmation';
import { UpgradeButton } from '../../../shared/components/upgrade/UpgradeButton';
import { useInviteContext } from '../../context/invite/InviteContextProvider';
import { handleVaultDeletionEffects } from '../../context/items/ItemEffects';
import { useItemsFilteringContext } from '../../hooks/useItemsFilteringContext';
import { useNavigationContext } from '../../hooks/useNavigationContext';
import { useOpenSettingsTab } from '../../hooks/useOpenSettingsTab';
import { usePopupContext } from '../../hooks/usePopupContext';
import { VaultModal, type Props as VaultModalProps } from '../../views/Vault/Vault.modal';
import { DropdownMenuButton } from '../Dropdown/DropdownMenuButton';
import { usePasswordContext } from '../PasswordGenerator/PasswordContext';
import { VaultDeleteModal } from '../Vault/VaultDeleteModal';
import { VaultIcon } from '../Vault/VaultIcon';
import { Submenu, type SubmenuLinkItem } from './Submenu';
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

    const vault = useSelector(selectShare<ShareType.Vault>(shareId));

    const passPlan = useSelector(selectPassPlan);
    const planDisplayName = useSelector(selectPlanDisplayName);

    const user = useSelector(selectUser);

    const openSettings = useOpenSettingsTab();

    const dispatch = useDispatch();
    const canLock = useSelector(selectHasRegisteredLock);
    const inviteContext = useInviteContext();
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
            label: c('Action').t`Generated password`,
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
                            handleVaultShareClick={withClose((vault: VaultShare) =>
                                inviteContext.invite(vault.shareId, ShareType.Vault)
                            )}
                            inTrash={inTrash}
                            handleRestoreTrash={handleRestoreTrash}
                            handleEmptyTrash={() => setDeleteAllConfirm(true)}
                        />

                        <hr className="dropdown-item-hr my-2 mx-4" aria-hidden="true" />

                        <DropdownMenuButton
                            onClick={() => openSettings()}
                            label={c('Label').t`Settings`}
                            labelClassname="flex-item-fluid"
                            icon={'cog-wheel'}
                            extra={<Icon name="arrow-out-square" className="ml-3 color-weak" />}
                        />

                        {canLock && (
                            <DropdownMenuButton
                                onClick={withClose(lock)}
                                disabled={!ready}
                                label={c('Action').t`Lock extension`}
                                icon="lock"
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
