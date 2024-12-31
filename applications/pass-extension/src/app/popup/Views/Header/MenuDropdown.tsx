import { type FC, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { usePopupContext } from 'proton-pass-extension/app/popup/PopupProvider';
import { MenuHamburger } from 'proton-pass-extension/app/popup/Views/Header/MenuHamburger';
import { MenuUser } from 'proton-pass-extension/app/popup/Views/Header/MenuUser';
import { MenuVaults } from 'proton-pass-extension/app/popup/Views/Header/MenuVaults';
import { useExtensionClient } from 'proton-pass-extension/lib/components/Extension/ExtensionClient';
import { useExpandPopup } from 'proton-pass-extension/lib/hooks/useExpandPopup';
import { useOpenSettingsTab } from 'proton-pass-extension/lib/hooks/useOpenSettingsTab';
import { c } from 'ttag';

import type { DropdownProps } from '@proton/components';
import { Dropdown, DropdownMenu, DropdownSizeUnit, usePopperAnchor } from '@proton/components';
import { verticalPopperPlacements } from '@proton/components/components/popper/utils';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { SecureLinkButton } from '@proton/pass/components/Menu/SecureLink/SecureLinkButton';
import { Submenu } from '@proton/pass/components/Menu/Submenu';
import { useNavigate } from '@proton/pass/components/Navigation/NavigationActions';
import { getLocalPath, getPassWebUrl } from '@proton/pass/components/Navigation/routing';
import { AccountPath } from '@proton/pass/constants';
import { type MenuItem, useMenuItems } from '@proton/pass/hooks/useMenuItems';
import { useNavigateToAccount } from '@proton/pass/hooks/useNavigateToAccount';
import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import browser from '@proton/pass/lib/globals/browser';
import { selectLockEnabled } from '@proton/pass/store/selectors';
import { withTap } from '@proton/pass/utils/fp/pipe';
import { PASS_APP_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';

const DROPDOWN_SIZE: NonNullable<DropdownProps['size']> = {
    height: DropdownSizeUnit.Dynamic,
    maxHeight: '30em',
    width: `24em`,
};

export const MenuDropdown: FC = () => {
    const { onLink } = usePassCore();
    const { API_URL } = usePassConfig();
    const { lock, logout } = useExtensionClient();
    const { interactive, expanded } = usePopupContext();

    const navigate = useNavigate();
    const navigateToAccount = useNavigateToAccount(AccountPath.ACCOUNT_PASSWORD);
    const canLock = useSelector(selectLockEnabled);

    const openSettings = useOpenSettingsTab();
    const expandPopup = useExpandPopup();

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const withClose = withTap(close);

    const menu = useMenuItems(
        useMemo(
            () => ({
                onAction: close,
                extra: {
                    advanced: !expanded
                        ? [
                              {
                                  icon: 'arrow-out-square',
                                  label: c('Action').t`Open in a window`,
                                  onClick: withClose(expandPopup),
                              },
                          ]
                        : [],
                    feedback: [
                        {
                            icon: 'life-ring',
                            label: c('Action').t`How to use ${PASS_APP_NAME}`,
                            url: browser.runtime.getURL('/onboarding.html#/welcome'),
                        },
                    ],
                },
            }),
            [expanded, expandPopup, close]
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
        <>
            <nav>
                <MenuHamburger ref={anchorRef} toggle={toggle} isOpen={isOpen} />

                <Dropdown
                    anchorRef={anchorRef}
                    autoClose={false}
                    isOpen={isOpen}
                    onClose={close}
                    availablePlacements={verticalPopperPlacements}
                    size={DROPDOWN_SIZE}
                    style={{ '--custom-max-width': DROPDOWN_SIZE.width }}
                >
                    <DropdownMenu>
                        <MenuUser />

                        <hr className="mb-2 mx-4" aria-hidden="true" />

                        <MenuVaults onAction={close} />

                        <SecureLinkButton
                            active={false}
                            className="pt-1.5 pb-1.5"
                            onClick={withClose(() => navigate(getLocalPath('secure-links')))}
                        />

                        <DropdownMenuButton
                            onClick={withClose(() => {
                                onLink(getPassWebUrl(API_URL, 'monitor'));
                            })}
                            label={c('Label').t`${PASS_SHORT_APP_NAME} monitor`}
                            icon={'pass-shield-warning'}
                            className="pt-1.5 pb-1.5"
                        />

                        <hr className="my-2 mx-4" aria-hidden="true" />

                        <DropdownMenuButton
                            onClick={withClose(() => openSettings())}
                            label={c('Label').t`Settings`}
                            icon={'cog-wheel'}
                            className="pt-1.5 pb-1.5"
                        />

                        {canLock && (
                            <DropdownMenuButton
                                onClick={withClose(lock)}
                                disabled={!interactive}
                                label={c('Action').t`Lock extension`}
                                icon="lock"
                                className="pt-1.5 pb-1.5"
                            />
                        )}

                        <DropdownMenuButton
                            onClick={withClose(() => onLink(getPassWebUrl(API_URL)))}
                            label={c('Action').t`Open web app`}
                            icon="arrow-out-square"
                            className="pt-1.5 pb-1.5"
                        />

                        <Submenu icon="notepad-checklist" label={c('Action').t`Advanced`} items={menu.advanced} />

                        <hr className="my-2 mx-4" aria-hidden="true" />

                        <Submenu icon="bug" label={c('Action').t`Feedback & Help`} items={menu.feedback} />
                        <Submenu icon="mobile" label={c('Action').t`Get mobile apps`} items={menu.download} />
                        <Submenu icon="user" label={c('Action').t`Account`} items={accountMenuItems} />
                    </DropdownMenu>
                </Dropdown>
            </nav>
        </>
    );
};
