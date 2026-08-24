import { type FC, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import { verticalPopperPlacements } from '@proton/atoms/Popper/utils';
import type { DropdownProps } from '@proton/components/components/dropdown/Dropdown';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import { PASS_APP_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { AccountPath } from '../../../constants';
import { useUserInitiatedLock } from '../../../hooks/auth/useUserInitiatedLock';
import { type MenuItem, useMenuItems } from '../../../hooks/useMenuItems';
import { useNavigateToAccount } from '../../../hooks/useNavigateToAccount';
import { selectLockEnabled } from '../../../store/selectors/settings';
import { withTap } from '../../../utils/fp/pipe';
import { usePassCore } from '../../Core/PassCoreProvider';
import { DropdownMenuButton } from '../../Layout/Dropdown/DropdownMenuButton';
import { useNavigate } from '../../Navigation/NavigationActions';
import { getLocalPath } from '../../Navigation/routing';
import { useOrganization } from '../../Organization/OrganizationProvider';
import { AdminPanelLabel } from '../B2B/AdminPanelLabel';
import { Submenu } from '../Submenu';
import { AppMenuButton } from './MenuButtons';
import { MenuUser } from './MenuUser';

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
    const navigate = useNavigate();

    const navigateToAccount = useNavigateToAccount(AccountPath.DASHBOARD);
    const navigateToAdminPanel = useNavigateToAccount(AccountPath.USERS);
    const canLock = useSelector(selectLockEnabled);
    const org = useOrganization();

    const appMenu = usePopperAnchor<HTMLButtonElement>();

    const withAppMenuClose = withTap(appMenu.close);

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

    const handleLock = useUserInitiatedLock(onLock);

    const handleMonitor = async () => {
        if (EXTENSION_BUILD && popup?.expanded !== true) return popup?.expand?.('monitor');
        return navigate(getLocalPath('monitor'));
    };

    return (
        <nav className="pass-menu-dropdown flex gap-2 lg:hidden">
            <AppMenuButton ref={appMenu.anchorRef} toggle={appMenu.toggle} isOpen={appMenu.isOpen} />

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

                    {org?.b2bAdmin && org.organization && (
                        <DropdownMenuButton
                            onClick={withAppMenuClose(navigateToAdminPanel)}
                            ellipsis={false}
                            icon="users"
                            className="pt-1.5 pb-1.5"
                            label={<AdminPanelLabel {...org.organization} />}
                        />
                    )}

                    <DropdownMenuButton
                        onClick={withAppMenuClose(() => openSettings())}
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
                            onClick={withAppMenuClose(handleLock)}
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
        </nav>
    );
};
