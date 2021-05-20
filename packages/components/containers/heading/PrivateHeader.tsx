import React from 'react';
import { APPS } from 'proton-shared/lib/constants';
import { c } from 'ttag';

import { AppLink, Hamburger, Icon, SettingsLink } from '../../components';
import { useConfig, useUser, usePaidCookie } from '../../hooks';
import Header, { Props as HeaderProps } from '../../components/header/Header';

import UserDropdown from './UserDropdown';
import { AppsDropdown } from '../app';
import TopNavbarListItemHelpDropdown from './TopNavbarListItemHelpDropdown';
import { TopNavbar, TopNavbarList, TopNavbarListItem } from '../../components/topnavbar';
import TopNavbarListItemButton from '../../components/topnavbar/TopNavbarListItemButton';
import { Vr } from '../../components/vr';

interface Props extends HeaderProps {
    logo?: React.ReactNode;
    settingsButton?: React.ReactNode;
    contactsButton?: React.ReactNode;
    feedbackButton?: React.ReactNode;
    backUrl?: string;
    floatingButton?: React.ReactNode;
    searchBox?: React.ReactNode;
    searchDropdown?: React.ReactNode;
    helpDropdown?: React.ReactNode;
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
    feedbackButton,
    backUrl,
    searchBox,
    searchDropdown,
    helpDropdown,
    floatingButton,
    expanded,
    onToggleExpand,
    title,
}: Props) => {
    const [{ hasPaidMail, hasPaidVpn }] = useUser();
    const { APP_NAME } = useConfig();
    usePaidCookie();

    if (backUrl) {
        return (
            <Header>
                <TopNavbarListItemButton
                    data-test-id="view:general-back"
                    as={AppLink}
                    to={backUrl}
                    icon={<Icon name="arrow-left" />}
                    text={c('Title').t`Back`}
                />
                <TopNavbar>
                    <TopNavbarList>
                        <TopNavbarListItem>
                            <UserDropdown />
                        </TopNavbarListItem>
                    </TopNavbarList>
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
                <TopNavbarList>
                    {isNarrow && searchDropdown ? <TopNavbarListItem>{searchDropdown}</TopNavbarListItem> : null}
                    {hasPaidMail || isVPN ? null : (
                        <TopNavbarListItem noShrink>
                            <TopNavbarListItemButton
                                as={SettingsLink}
                                shape="outline"
                                color="norm"
                                text={c('Link').t`Upgrade`}
                                icon={<Icon name="upgrade" />}
                                path="/dashboard"
                                title={c('Link').t`Go to subscription plans`}
                            />
                        </TopNavbarListItem>
                    )}
                    {hasPaidVpn || !isVPN ? null : (
                        <TopNavbarListItem noShrink>
                            <TopNavbarListItemButton
                                as={AppLink}
                                text={c('Link').t`Upgrade`}
                                icon={<Icon name="upgrade" />}
                                to="/dashboard"
                                title={c('Link').t`Go to subscription plans`}
                            />
                        </TopNavbarListItem>
                    )}
                    {feedbackButton ? <TopNavbarListItem noShrink>{feedbackButton}</TopNavbarListItem> : null}
                    {contactsButton ? <TopNavbarListItem noShrink>{contactsButton}</TopNavbarListItem> : null}
                    {settingsButton ? <TopNavbarListItem noShrink>{settingsButton}</TopNavbarListItem> : null}
                    <TopNavbarListItem noShrink>{helpDropdown || <TopNavbarListItemHelpDropdown />}</TopNavbarListItem>
                    {!isNarrow && (
                        <TopNavbarListItem noShrink className="flex-align-self-stretch topnav-vr">
                            <Vr className="h100 mr1 ml1" />
                        </TopNavbarListItem>
                    )}
                    <TopNavbarListItem className="relative">
                        <UserDropdown />
                    </TopNavbarListItem>
                </TopNavbarList>
            </TopNavbar>
            {isNarrow && floatingButton ? floatingButton : null}
        </Header>
    );
};

export default PrivateHeader;
