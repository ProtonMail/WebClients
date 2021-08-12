import * as React from 'react';
import { APPS } from '@proton/shared/lib/constants';
import { c } from 'ttag';

import { AppLink, Hamburger, Icon, SettingsLink } from '../../components';
import { useConfig, useUser, usePlans, useSubscription } from '../../hooks';
import Header, { Props as HeaderProps } from '../../components/header/Header';

import UserDropdown from './UserDropdown';
import { AppsDropdown } from '../app';
import TopNavbarListItemBlackFridayButton from './TopNavbarListItemBlackFridayButton';
import useBlackFriday from './useBlackFriday';

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
    hasAppsDropdown?: boolean;
    title: string;
    expanded: boolean;
    onToggleExpand?: () => void;
    onOpenChat?: () => void;
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
    floatingButton,
    expanded,
    onToggleExpand,
    onOpenChat,
    title,
}: Props) => {
    const [{ hasPaidMail, hasPaidVpn }] = useUser();
    const [plans = []] = usePlans();
    const [subscription] = useSubscription();
    const { APP_NAME } = useConfig();
    const showBlackFridayButton = useBlackFriday();

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
            {title && isNarrow ? <span className="text-xl lh-rg mtauto mbauto text-ellipsis">{title}</span> : null}
            {isNarrow ? null : searchBox}
            <TopNavbar>
                <TopNavbarList>
                    {isNarrow && searchDropdown ? <TopNavbarListItem>{searchDropdown}</TopNavbarListItem> : null}
                    {showBlackFridayButton ? (
                        <TopNavbarListItem noShrink>
                            <TopNavbarListItemBlackFridayButton plans={plans} subscription={subscription} />
                        </TopNavbarListItem>
                    ) : null}
                    {hasPaidMail || isVPN ? null : (
                        <TopNavbarListItem noShrink collapsedOnDesktop={false}>
                            <TopNavbarListItemButton
                                as={SettingsLink}
                                shape="outline"
                                color="norm"
                                text={c('Link').t`Upgrade`}
                                icon={<Icon name="arrow-up-big-line" />}
                                path="/dashboard"
                                title={c('Link').t`Go to subscription plans`}
                            />
                        </TopNavbarListItem>
                    )}
                    {hasPaidVpn || !isVPN ? null : (
                        <TopNavbarListItem noShrink collapsedOnDesktop={false}>
                            <TopNavbarListItemButton
                                as={AppLink}
                                text={c('Link').t`Upgrade`}
                                icon={<Icon name="arrow-up-big-line" />}
                                to="/dashboard"
                                title={c('Link').t`Go to subscription plans`}
                            />
                        </TopNavbarListItem>
                    )}
                    {feedbackButton ? <TopNavbarListItem noShrink>{feedbackButton}</TopNavbarListItem> : null}
                    {contactsButton ? <TopNavbarListItem noShrink>{contactsButton}</TopNavbarListItem> : null}
                    {settingsButton ? <TopNavbarListItem noShrink>{settingsButton}</TopNavbarListItem> : null}
                    {!isNarrow && (
                        <TopNavbarListItem noShrink className="flex-align-self-stretch topnav-vr">
                            <Vr className="h100 mr1 ml1" />
                        </TopNavbarListItem>
                    )}
                    <TopNavbarListItem className="relative">
                        <UserDropdown onOpenChat={onOpenChat} />
                    </TopNavbarListItem>
                </TopNavbarList>
            </TopNavbar>
            {isNarrow && floatingButton ? floatingButton : null}
        </Header>
    );
};

export default PrivateHeader;
