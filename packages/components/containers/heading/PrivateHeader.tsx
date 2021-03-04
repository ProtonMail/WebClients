import React from 'react';
import { APPS } from 'proton-shared/lib/constants';
import { c } from 'ttag';

import { Hamburger } from '../../components';
import { useConfig, useUser, usePlans, useSubscription, usePaidCookie } from '../../hooks';
import Header, { Props as HeaderProps } from '../../components/header/Header';

import UserDropdown from './UserDropdown';
import TopNavbarLink from '../../components/link/TopNavbarLink';
import { TopNavbarItem } from '../app/TopNavbar';
import { AppsDropdown, TopNavbar } from '../app';
import SupportDropdown from './SupportDropdown';
import UpgradeButton from './UpgradeButton';
import UpgradeVPNButton from './UpgradeVPNButton';
import BlackFridayButton from './BlackFridayButton';
import useBlackFriday from './useBlackFriday';

interface Props extends HeaderProps {
    logo?: React.ReactNode;
    settingsButton?: React.ReactNode;
    contactsButton?: React.ReactNode;
    backUrl?: string;
    floatingButton?: React.ReactNode;
    searchBox?: React.ReactNode;
    searchDropdown?: React.ReactNode;
    supportDropdown?: React.ReactNode;
    hasAppsDropdown?: boolean;
    title: string;
    expanded: boolean;
    onToggleExpand?: () => void;
    isNarrow?: boolean;
}
const PrivateHeader = ({
    isNarrow,
    hasAppsDropdown = true,
    logo,
    settingsButton,
    contactsButton,
    backUrl,
    searchBox,
    searchDropdown,
    supportDropdown,
    floatingButton,
    expanded,
    onToggleExpand,
    title,
}: Props) => {
    const [{ hasPaidMail, hasPaidVpn }] = useUser();
    const [plans = []] = usePlans();
    const [subscription] = useSubscription();
    const { APP_NAME } = useConfig();
    const showBlackFridayButton = useBlackFriday();
    usePaidCookie();

    if (backUrl) {
        return (
            <Header>
                <TopNavbarLink
                    data-test-id="view:general-back"
                    to={backUrl}
                    icon="arrow-left"
                    text={c('Title').t`Back`}
                />
                <TopNavbar>
                    <TopNavbarItem>
                        <UserDropdown />
                    </TopNavbarItem>
                </TopNavbar>
            </Header>
        );
    }

    const isVPN = APP_NAME === APPS.PROTONVPN_SETTINGS;

    return (
        <Header>
            <div className="logo-container flex flex-justify-space-between flex-align-items-center flex-nowrap no-mobile">
                {logo}
                {hasAppsDropdown ? <AppsDropdown /> : null}
            </div>
            <Hamburger expanded={expanded} onToggle={onToggleExpand} />
            {title && isNarrow ? <span className="text-lg lh-rg mtauto mbauto text-ellipsis">{title}</span> : null}
            {isNarrow ? null : searchBox}
            <TopNavbar>
                {isNarrow && searchDropdown ? <TopNavbarItem>{searchDropdown}</TopNavbarItem> : null}
                {showBlackFridayButton ? (
                    <TopNavbarItem>
                        <BlackFridayButton plans={plans} subscription={subscription} />
                    </TopNavbarItem>
                ) : null}
                {hasPaidMail || isNarrow || isVPN ? null : (
                    <TopNavbarItem>
                        <UpgradeButton />
                    </TopNavbarItem>
                )}
                {hasPaidVpn || isNarrow || !isVPN ? null : (
                    <TopNavbarItem>
                        <UpgradeVPNButton />
                    </TopNavbarItem>
                )}
                {!contactsButton ? null : <TopNavbarItem>{contactsButton}</TopNavbarItem>}
                {!settingsButton ? null : <TopNavbarItem>{settingsButton}</TopNavbarItem>}
                <TopNavbarItem>{supportDropdown || <SupportDropdown />}</TopNavbarItem>
                <TopNavbarItem className="relative">
                    <UserDropdown />
                </TopNavbarItem>
            </TopNavbar>
            {isNarrow && floatingButton ? floatingButton : null}
        </Header>
    );
};

export default PrivateHeader;
