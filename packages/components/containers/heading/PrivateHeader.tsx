import { ReactNode } from 'react';
import { APPS } from '@proton/shared/lib/constants';
import { c } from 'ttag';
import { useLocation } from 'react-router-dom';

import { AppLink, Hamburger, Icon, SettingsLink } from '../../components';
import { useConfig, useUser } from '../../hooks';
import Header, { Props as HeaderProps } from '../../components/header/Header';

import { AppsDropdown } from '../app';
import TopNavbarListItemBlackFridayButton from './TopNavbarListItemBlackFridayButton';
import usePromotionOffer from './usePromotionOffer';

import { TopNavbar, TopNavbarList, TopNavbarListItem } from '../../components/topnavbar';
import TopNavbarListItemButton from '../../components/topnavbar/TopNavbarListItemButton';
import { Vr } from '../../components/vr';

interface Props extends HeaderProps {
    logo?: ReactNode;
    settingsButton?: ReactNode;
    userDropdown?: ReactNode;
    contactsButton?: ReactNode;
    feedbackButton?: ReactNode;
    backUrl?: string;
    floatingButton?: ReactNode;
    searchBox?: ReactNode;
    searchDropdown?: ReactNode;
    appsDropdown?: ReactNode;
    title: string;
    expanded: boolean;
    onToggleExpand?: () => void;
    isNarrow?: boolean;
}

const PrivateHeader = ({
    isNarrow,
    appsDropdown: AppsDropdownComponent = <AppsDropdown />,
    userDropdown,
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
    title,
}: Props) => {
    const [user] = useUser();
    const { APP_NAME } = useConfig();
    const offer = usePromotionOffer();
    const location = useLocation();

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
                        <TopNavbarListItem>{userDropdown}</TopNavbarListItem>
                    </TopNavbarList>
                </TopNavbar>
            </Header>
        );
    }

    const isVPN = APP_NAME === APPS.PROTONVPN_SETTINGS;
    const upgradePathname = isVPN ? '/dashboard' : '/upgrade';

    return (
        <Header>
            <div className="logo-container flex flex-justify-space-between flex-align-items-center flex-nowrap no-mobile">
                {logo}
                {AppsDropdownComponent}
            </div>
            <Hamburger expanded={expanded} onToggle={onToggleExpand} />
            {title && isNarrow ? <span className="text-xl lh-rg mtauto mbauto text-ellipsis">{title}</span> : null}
            {isNarrow ? null : searchBox}
            <TopNavbar>
                <TopNavbarList>
                    {isNarrow && searchDropdown ? <TopNavbarListItem>{searchDropdown}</TopNavbarListItem> : null}
                    {offer ? (
                        <TopNavbarListItem noShrink>
                            <TopNavbarListItemBlackFridayButton offer={offer} />
                        </TopNavbarListItem>
                    ) : null}
                    {user.isFree && !location.pathname.endsWith(upgradePathname) && (
                        <TopNavbarListItem noShrink collapsedOnDesktop={false}>
                            <TopNavbarListItemButton
                                as={SettingsLink}
                                shape="outline"
                                color="norm"
                                text={c('Link').t`Upgrade`}
                                icon={<Icon name="arrow-up-big-line" />}
                                path={upgradePathname}
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
                    {userDropdown && <TopNavbarListItem className="relative">{userDropdown}</TopNavbarListItem>}
                </TopNavbarList>
            </TopNavbar>
            {isNarrow && floatingButton ? floatingButton : null}
        </Header>
    );
};

export default PrivateHeader;
