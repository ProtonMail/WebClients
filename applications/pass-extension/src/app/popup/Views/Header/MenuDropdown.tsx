import { type FC, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { usePopupContext } from 'proton-pass-extension/app/popup/PopupProvider';
import { ExtensionMenuHamburger } from 'proton-pass-extension/app/popup/Views/Header/ExtensionMenuHamburger';
import { MenuHamburger } from 'proton-pass-extension/app/popup/Views/Header/MenuHamburger';
import { MenuUser } from 'proton-pass-extension/app/popup/Views/Header/MenuUser';
import { useExtensionClient } from 'proton-pass-extension/lib/components/Extension/ExtensionClient';
import { useExpandPopup } from 'proton-pass-extension/lib/hooks/useExpandPopup';
import { useOpenSettingsTab } from 'proton-pass-extension/lib/hooks/useOpenSettingsTab';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { DropdownProps } from '@proton/components';
import { Dropdown, DropdownMenu, DropdownSizeUnit, usePopperAnchor } from '@proton/components';
import { verticalPopperPlacements } from '@proton/components/components/popper/utils';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { SharedMenuContent } from '@proton/pass/components/Menu/Shared/SharedMenu';
import { Submenu } from '@proton/pass/components/Menu/Submenu';
import { VaultMenu } from '@proton/pass/components/Menu/Vault/VaultMenu';
import { getPassWebUrl } from '@proton/pass/components/Navigation/routing';
import { useVaultActions } from '@proton/pass/components/Vault/VaultActionsProvider';
import { AccountPath } from '@proton/pass/constants';
import { type MenuItem, useMenuItems } from '@proton/pass/hooks/useMenuItems';
import { useNavigateToAccount } from '@proton/pass/hooks/useNavigateToAccount';
import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import { selectLockEnabled } from '@proton/pass/store/selectors';
import { withTap } from '@proton/pass/utils/fp/pipe';
import { PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';

const DROPDOWN_SIZE: NonNullable<DropdownProps['size']> = {
    height: DropdownSizeUnit.Dynamic,
    maxHeight: '26em',
    width: `18em`,
};

export const MenuDropdown: FC = () => {
    const { onLink } = usePassCore();
    const { API_URL } = usePassConfig();
    const { lock, logout } = useExtensionClient();
    const { interactive, expanded } = usePopupContext();
    const vaultActions = useVaultActions();

    const navigateToAccount = useNavigateToAccount(AccountPath.ACCOUNT_PASSWORD);
    const canLock = useSelector(selectLockEnabled);

    const openSettings = useOpenSettingsTab();
    const expandPopup = useExpandPopup();

    const {
        anchorRef: menuAnchorRef,
        isOpen: menuIsOpen,
        toggle: menuToggle,
        close: menuClose,
    } = usePopperAnchor<HTMLButtonElement>();
    const {
        anchorRef: extensionAnchorRef,
        isOpen: extensionIsOpen,
        toggle: extensionToggle,
        close: extensionClose,
    } = usePopperAnchor<HTMLButtonElement>();
    const withMenuClose = withTap(menuClose);
    const withExtensionClose = withTap(extensionClose);

    const menu = useMenuItems(
        useMemo(
            () => ({
                onAction: menuClose,
                extra: {
                    advanced: !expanded
                        ? [
                              {
                                  icon: 'arrow-out-square',
                                  label: c('Action').t`Open in a window`,
                                  onClick: withMenuClose(expandPopup),
                              },
                          ]
                        : [],
                },
            }),
            [expanded, expandPopup, menuClose]
        )
    );

    const accountMenuItems: MenuItem[] = useMemo(
        () => [
            {
                onClick: navigateToAccount,
                label: c('Action').t`Account settings`,
                icon: 'arrow-out-square',
            },
            {
                onClick: () => logout({ soft: false }),
                label: c('Action').t`Sign out`,
                icon: 'arrow-out-from-rectangle',
            },
        ],
        []
    );

    return (
        <nav className="flex gap-2">
            <ExtensionMenuHamburger ref={extensionAnchorRef} toggle={extensionToggle} isOpen={extensionIsOpen} />
            <MenuHamburger ref={menuAnchorRef} toggle={menuToggle} isOpen={menuIsOpen} />

            <Dropdown
                anchorRef={extensionAnchorRef}
                autoClose={false}
                isOpen={extensionIsOpen}
                onClose={extensionClose}
                availablePlacements={verticalPopperPlacements}
                size={DROPDOWN_SIZE}
                style={{ '--custom-max-width': DROPDOWN_SIZE.width }}
            >
                <DropdownMenu>
                    <MenuUser />

                    <hr className="mb-2 mx-4" aria-hidden="true" />

                    <DropdownMenuButton
                        onClick={withExtensionClose(() => onLink(getPassWebUrl(API_URL, 'monitor')))}
                        label={c('Label').t`${PASS_SHORT_APP_NAME} Monitor`}
                        icon={'pass-shield-warning'}
                        className="pt-1.5 pb-1.5"
                    />

                    <DropdownMenuButton
                        onClick={withExtensionClose(() => openSettings())}
                        label={c('Label').t`Settings`}
                        icon={'cog-wheel'}
                        className="pt-1.5 pb-1.5"
                    />

                    {canLock && (
                        <DropdownMenuButton
                            onClick={withExtensionClose(lock)}
                            disabled={!interactive}
                            label={c('Action').t`Lock extension`}
                            icon="lock"
                            className="pt-1.5 pb-1.5"
                        />
                    )}

                    <DropdownMenuButton
                        onClick={withExtensionClose(() => onLink(getPassWebUrl(API_URL)))}
                        label={c('Action').t`Open web app`}
                        icon="arrow-out-square"
                        className="pt-1.5 pb-1.5"
                    />

                    <Submenu icon="notepad-checklist" label={c('Action').t`Advanced`} items={menu.advanced} />

                    <hr className="my-2 mx-4" aria-hidden="true" />

                    <Submenu icon="mobile" label={c('Action').t`Get mobile apps`} items={menu.download} />
                    <Submenu icon="user" label={c('Action').t`Account`} items={accountMenuItems} />
                </DropdownMenu>
            </Dropdown>

            <Dropdown
                anchorRef={menuAnchorRef}
                autoClose={false}
                isOpen={menuIsOpen}
                onClose={menuClose}
                availablePlacements={verticalPopperPlacements}
                size={DROPDOWN_SIZE}
                style={{ '--custom-max-width': DROPDOWN_SIZE.width }}
                contentProps={{ className: 'flex flex-column flex-nowrap' }}
            >
                <div className="overflow-auto p-2 pb-0">
                    <VaultMenu onAction={menuClose} />
                    <SharedMenuContent onAction={menuClose} />
                </div>

                <div className="p-2 w-full shrink-0">
                    <Button className="w-full" color="weak" shape="solid" onClick={withMenuClose(vaultActions.create)}>
                        {c('Action').t`Create vault`}
                    </Button>
                </div>
            </Dropdown>
        </nav>
    );
};
