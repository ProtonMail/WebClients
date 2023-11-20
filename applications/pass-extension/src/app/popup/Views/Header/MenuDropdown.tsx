import { type VFC } from 'react';
import { useSelector } from 'react-redux';

import { useExpandPopup } from 'proton-pass-extension/lib/hooks/useExpandPopup';
import { useItemsFilteringContext } from 'proton-pass-extension/lib/hooks/useItemsFilteringContext';
import { useNavigationContext } from 'proton-pass-extension/lib/hooks/useNavigationContext';
import { useOpenSettingsTab } from 'proton-pass-extension/lib/hooks/useOpenSettingsTab';
import { usePopupContext } from 'proton-pass-extension/lib/hooks/usePopupContext';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { DropdownProps } from '@proton/components';
import { Dropdown, DropdownMenu, DropdownSizeUnit, Icon, usePopperAnchor } from '@proton/components';
import { UpgradeButton } from '@proton/pass/components/Layout/Button/UpgradeButton';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { Submenu } from '@proton/pass/components/Menu/Submenu';
import { VaultSubmenu } from '@proton/pass/components/Menu/Vault/VaultSubmenu';
import type { MenuItem } from '@proton/pass/components/Menu/hooks';
import { useFeedbackLinks } from '@proton/pass/components/Menu/hooks';
import { usePasswordContext } from '@proton/pass/components/PasswordGenerator/PasswordContext';
import { useVaultActions } from '@proton/pass/components/Vault/VaultActionsProvider';
import { VaultIcon } from '@proton/pass/components/Vault/VaultIcon';
import {
    selectHasRegisteredLock,
    selectPassPlan,
    selectPlanDisplayName,
    selectShare,
    selectUser,
} from '@proton/pass/store/selectors';
import type { MaybeNull, ShareType } from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { VaultColor } from '@proton/pass/types/protobuf/vault-v1';
import { pipe, tap } from '@proton/pass/utils/fp/pipe';
import clsx from '@proton/utils/clsx';

const DROPDOWN_SIZE: NonNullable<DropdownProps['size']> = {
    width: `20em`,
    height: DropdownSizeUnit.Dynamic,
    maxHeight: '380px',
};

export const MenuDropdown: VFC = () => {
    const { sync, lock, logout, ready, expanded } = usePopupContext();
    const { inTrash, unselectItem } = useNavigationContext();
    const { shareId, setSearch, setShareId } = useItemsFilteringContext();
    const vaultActions = useVaultActions();

    const vault = useSelector(selectShare<ShareType.Vault>(shareId));
    const passPlan = useSelector(selectPassPlan);
    const planDisplayName = useSelector(selectPlanDisplayName);
    const user = useSelector(selectUser);
    const canLock = useSelector(selectHasRegisteredLock);

    const openSettings = useOpenSettingsTab();
    const expandPopup = useExpandPopup();

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const withClose = <P extends any[], R extends any>(cb: (...args: P) => R) => pipe(cb, tap(close));

    const handleVaultSelect = withClose((vaultShareId: MaybeNull<string>) => {
        unselectItem();
        setShareId(vaultShareId);
        setSearch('');
    });

    /* define for download, advanced links etc.. */
    const feedbackLinks = useFeedbackLinks();

    const downloadLinks: MenuItem[] = [
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

    const advancedLinks: MenuItem[] = [
        {
            icon: 'key-history',
            label: c('Action').t`Generated passwords`,
            onClick: withClose(openPasswordHistory),
        },
        {
            icon: 'arrow-rotate-right',
            label: c('Action').t`Manually sync your data`,
            onClick: withClose(sync),
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
                        color={inTrash ? VaultColor.COLOR_UNSPECIFIED : vault?.content.display.color}
                        icon={inTrash ? 'pass-trash' : vault?.content.display.icon}
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
                        </div>

                        {passPlan !== UserPassPlan.PLUS && (
                            <div className="pb-2 px-4">
                                <UpgradeButton className="w-full" />
                            </div>
                        )}

                        <hr className="dropdown-item-hr my-2 mx-4" aria-hidden="true" />

                        <VaultSubmenu
                            inTrash={inTrash}
                            selectedShareId={shareId}
                            handleVaultSelect={withClose(handleVaultSelect)}
                            handleVaultCreate={withClose(vaultActions.create)}
                            handleVaultEdit={withClose(vaultActions.edit)}
                            handleVaultMoveAllItems={withClose(vaultActions.moveItems)}
                            handleVaultDelete={withClose(vaultActions.delete)}
                            handleVaultInvite={withClose(vaultActions.invite)}
                            handleVaultManage={withClose(vaultActions.manage)}
                            handleVaultLeave={withClose(vaultActions.leave)}
                            handleTrashEmpty={withClose(vaultActions.trashEmpty)}
                            handleTrashRestore={withClose(vaultActions.trashRestore)}
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
        </>
    );
};
