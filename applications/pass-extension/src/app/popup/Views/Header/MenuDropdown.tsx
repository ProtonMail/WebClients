import { type FC, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { usePopupContext } from 'proton-pass-extension/app/popup/PopupProvider';
import { MenuUser } from 'proton-pass-extension/app/popup/Views/Header/MenuUser';
import { useExtensionClient } from 'proton-pass-extension/lib/components/Extension/ExtensionClient';
import { useOpenSettingsTab } from 'proton-pass-extension/lib/hooks/useOpenSettingsTab';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { DropdownProps } from '@proton/components';
import { Dropdown, DropdownMenu, DropdownSizeUnit, usePopperAnchor } from '@proton/components';
import { verticalPopperPlacements } from '@proton/components/components/popper/utils';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { SharedMenuContent } from '@proton/pass/components/Menu/Shared/SharedMenu';
import { Submenu } from '@proton/pass/components/Menu/Submenu';
import { VaultMenu } from '@proton/pass/components/Menu/Vault/VaultMenu';
import { getPassWebUrl } from '@proton/pass/components/Navigation/routing';
import { OrganizationPolicyTooltip } from '@proton/pass/components/Organization/OrganizationPolicyTooltip';
import { useVaultActions } from '@proton/pass/components/Vault/VaultActionsProvider';
import { AccountPath } from '@proton/pass/constants';
import { type MenuItem, useMenuItems } from '@proton/pass/hooks/useMenuItems';
import { useNavigateToAccount } from '@proton/pass/hooks/useNavigateToAccount';
import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import { selectLockEnabled, selectOrganizationVaultCreationDisabled } from '@proton/pass/store/selectors';
import { withTap } from '@proton/pass/utils/fp/pipe';
import { PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { AppMenuButton, VaultMenuButton } from './MenuButtons';

import './MenuDropdown.scss';

const DROPDOWN_SIZE: NonNullable<DropdownProps['size']> = {
    height: DropdownSizeUnit.Dynamic,
    maxHeight: '26em',
    width: `22em`,
};

export const MenuDropdown: FC = () => {
    const { onLink, popup } = usePassCore();
    const { API_URL } = usePassConfig();
    const { lock, logout } = useExtensionClient();
    const { interactive } = usePopupContext();
    const vaultActions = useVaultActions();

    const navigateToAccount = useNavigateToAccount(AccountPath.ACCOUNT_PASSWORD);
    const canLock = useSelector(selectLockEnabled);

    const openSettings = useOpenSettingsTab();

    const appMenu = usePopperAnchor<HTMLButtonElement>();
    const vaultMenu = usePopperAnchor<HTMLButtonElement>();

    const withAppMenuClose = withTap(appMenu.close);
    const withVaultMenuClose = withTap(vaultMenu.close);

    const vaultCreationDisabled = useSelector(selectOrganizationVaultCreationDisabled);

    const { advanced, download } = useMenuItems(
        useMemo(
            () => ({
                onAction: appMenu.close,
                extra: {
                    advanced: !popup?.expanded
                        ? [
                              {
                                  icon: 'arrow-within-square',
                                  label: c('Action').t`Open in a window`,
                                  onClick: withAppMenuClose(popup?.expand ?? noop),
                              },
                          ]
                        : [],
                },
            }),
            [appMenu.close]
        )
    );

    const accountMenuItems: MenuItem[] = useMemo(
        () => [
            {
                onClick: navigateToAccount,
                label: c('Action').t`Account settings`,
                icon: 'arrow-within-square',
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
            <AppMenuButton ref={appMenu.anchorRef} toggle={appMenu.toggle} isOpen={appMenu.isOpen} />
            <VaultMenuButton ref={vaultMenu.anchorRef} toggle={vaultMenu.toggle} isOpen={vaultMenu.isOpen} />

            <Dropdown
                anchorRef={appMenu.anchorRef}
                autoClose={false}
                isOpen={appMenu.isOpen}
                onClose={appMenu.close}
                availablePlacements={verticalPopperPlacements}
                size={DROPDOWN_SIZE}
                style={{ '--custom-max-width': DROPDOWN_SIZE.width }}
            >
                <DropdownMenu>
                    <MenuUser />

                    <hr className="mb-2 mx-4" aria-hidden="true" />

                    <DropdownMenuButton
                        onClick={withAppMenuClose(() => onLink(getPassWebUrl(API_URL, 'monitor')))}
                        label={c('Label').t`${PASS_SHORT_APP_NAME} Monitor`}
                        icon={'pass-shield-warning'}
                        className="pt-1.5 pb-1.5"
                    />

                    <DropdownMenuButton
                        onClick={withAppMenuClose(() => openSettings())}
                        label={c('Label').t`Settings`}
                        icon={'cog-wheel'}
                        className="pt-1.5 pb-1.5"
                    />

                    {canLock && (
                        <DropdownMenuButton
                            onClick={withAppMenuClose(lock)}
                            disabled={!interactive}
                            label={c('Action').t`Lock extension`}
                            icon="lock"
                            className="pt-1.5 pb-1.5"
                        />
                    )}

                    <DropdownMenuButton
                        onClick={withAppMenuClose(() => onLink(getPassWebUrl(API_URL)))}
                        label={c('Action').t`Open web app`}
                        icon="arrow-within-square"
                        className="pt-1.5 pb-1.5"
                    />

                    <Submenu icon="notepad-checklist" label={c('Action').t`Advanced`} items={advanced} />

                    <hr className="my-2 mx-4" aria-hidden="true" />

                    <Submenu icon="mobile" label={c('Action').t`Get mobile apps`} items={download} />
                    <Submenu icon="user" label={c('Action').t`Account`} items={accountMenuItems} />
                </DropdownMenu>
            </Dropdown>

            <Dropdown
                anchorRef={vaultMenu.anchorRef}
                autoClose={false}
                isOpen={vaultMenu.isOpen}
                onClose={vaultMenu.close}
                availablePlacements={verticalPopperPlacements}
                size={DROPDOWN_SIZE}
                style={{ '--custom-max-width': DROPDOWN_SIZE.width }}
                contentProps={{ className: 'flex flex-column flex-nowrap' }}
            >
                <div className="overflow-auto p-2 pb-0">
                    <div className="flex flex-column">
                        <VaultMenu onAction={vaultMenu.close} />
                        <SharedMenuContent onAction={vaultMenu.close} />
                    </div>
                </div>

                <div className="p-2 w-full shrink-0">
                    <OrganizationPolicyTooltip
                        enforced={vaultCreationDisabled}
                        text={c('Warning').t`Your organization does not allow creating a vault`}
                    >
                        <Button
                            className="w-full"
                            color="weak"
                            shape="solid"
                            onClick={withVaultMenuClose(vaultActions.create)}
                            disabled={vaultCreationDisabled}
                        >
                            {c('Action').t`Create vault`}
                        </Button>
                    </OrganizationPolicyTooltip>
                </div>
            </Dropdown>
        </nav>
    );
};
