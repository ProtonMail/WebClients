import { type FC, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { DropdownProps } from '@proton/components/components/dropdown/Dropdown';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import { verticalPopperPlacements } from '@proton/components/components/popper/utils';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { MenuUser } from '@proton/pass/components/Menu/Dropdown/MenuUser';
import { SharedMenuContent } from '@proton/pass/components/Menu/Shared/SharedMenu';
import { Submenu } from '@proton/pass/components/Menu/Submenu';
import { VaultMenu } from '@proton/pass/components/Menu/Vault/VaultMenu';
import { useNavigate } from '@proton/pass/components/Navigation/NavigationActions';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { OrganizationPolicyTooltip } from '@proton/pass/components/Organization/OrganizationPolicyTooltip';
import { useVaultActions } from '@proton/pass/components/Vault/VaultActionsProvider';
import { AccountPath } from '@proton/pass/constants';
import { useVaultCreationPolicy } from '@proton/pass/hooks/organization/useVaultCreationPolicy';
import { type MenuItem, useMenuItems } from '@proton/pass/hooks/useMenuItems';
import { useNavigateToAccount } from '@proton/pass/hooks/useNavigateToAccount';
import { selectLockEnabled } from '@proton/pass/store/selectors/settings';
import { withTap } from '@proton/pass/utils/fp/pipe';
import { PASS_APP_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { AppMenuButton, VaultMenuButton } from './MenuButtons';

import './MenuDropdown.scss';

const DROPDOWN_SIZE: NonNullable<DropdownProps['size']> = {
    height: DropdownSizeUnit.Dynamic,
    maxHeight: '26em',
    width: `22em`,
};

type Props = {
    onLock: () => void;
    onLogout: (options: { soft: boolean }) => void;
    interactive: boolean;
};

export const MenuDropdown: FC<Props> = ({ onLock, onLogout, interactive }) => {
    const { popup, openSettings } = usePassCore();
    const vaultActions = useVaultActions();
    const navigate = useNavigate();

    const navigateToAccount = useNavigateToAccount(AccountPath.ACCOUNT_PASSWORD);
    const canLock = useSelector(selectLockEnabled);

    const appMenu = usePopperAnchor<HTMLButtonElement>();
    const vaultMenu = usePopperAnchor<HTMLButtonElement>();

    const withAppMenuClose = withTap(appMenu.close);
    const withVaultMenuClose = withTap(vaultMenu.close);

    const { vaultCreationDisabled } = useVaultCreationPolicy();

    const { advanced, download } = useMenuItems(useMemo(() => ({ onAction: appMenu.close }), [appMenu.close]));

    const accountMenuItems: MenuItem[] = useMemo(
        () => [
            {
                onClick: navigateToAccount,
                label: c('Action').t`Account settings`,
                icon: 'arrow-within-square',
            },
            {
                onClick: () => onLogout({ soft: false }),
                label: c('Action').t`Sign out`,
                icon: 'arrow-out-from-rectangle',
            },
        ],
        []
    );

    const handleMonitor = async () => {
        if (EXTENSION_BUILD && popup?.expanded !== true) return popup?.expand?.('monitor');
        return navigate(getLocalPath('monitor'));
    };

    return (
        <nav className="flex gap-2">
            <div className="flex gap-2 lg:hidden">
                <AppMenuButton ref={appMenu.anchorRef} toggle={appMenu.toggle} isOpen={appMenu.isOpen} />
                <VaultMenuButton ref={vaultMenu.anchorRef} toggle={vaultMenu.toggle} isOpen={vaultMenu.isOpen} />
            </div>

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
                        onClick={withAppMenuClose(handleMonitor)}
                        label={c('Label').t`${PASS_SHORT_APP_NAME} Monitor`}
                        icon={'pass-shield-warning'}
                        className="pt-1.5 pb-1.5"
                    />

                    <DropdownMenuButton
                        onClick={withAppMenuClose(() => openSettings?.())}
                        label={c('Label').t`Settings`}
                        icon={'cog-wheel'}
                        className="pt-1.5 pb-1.5"
                    />

                    {popup?.expanded === false && (
                        <DropdownMenuButton
                            onClick={withAppMenuClose(() => popup?.expand?.())}
                            label={c('Label').t`Larger window`}
                            icon="arrow-within-square"
                            className="pt-1.5 pb-1.5"
                        />
                    )}

                    {canLock && (
                        <DropdownMenuButton
                            onClick={withAppMenuClose(onLock)}
                            disabled={!interactive}
                            label={
                                EXTENSION_BUILD ? c('Action').t`Lock extension` : c('Action').t`Lock ${PASS_APP_NAME}`
                            }
                            icon="lock"
                            className="pt-1.5 pb-1.5"
                        />
                    )}

                    <Submenu icon="notepad-checklist" label={c('Action').t`Advanced`} items={advanced} />

                    <hr className="my-2 mx-4" aria-hidden="true" />

                    <Submenu
                        icon="mobile"
                        label={
                            // translator: if the translated text is longer than the english text,
                            // please simply translate as "Get apps" because UI space is limited.
                            c('Action').t`Get mobile and desktop apps`
                        }
                        items={download}
                    />
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
