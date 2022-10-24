import { ReactNode } from 'react';

import { c } from 'ttag';

import { Vr } from '@proton/atoms';

import { useNoBFCookie } from '../..';
import { AppLink, Hamburger, Icon } from '../../components';
import Header, { Props as HeaderProps } from '../../components/header/Header';
import { TopNavbar, TopNavbarList, TopNavbarListItem, TopNavbarUpsell } from '../../components/topnavbar';
import TopNavbarListItemButton from '../../components/topnavbar/TopNavbarListItemButton';
import { AppsDropdown } from '../app';

interface Props extends HeaderProps {
    logo?: ReactNode;
    settingsButton?: ReactNode;
    userDropdown?: ReactNode;
    contactsButton?: ReactNode;
    feedbackButton?: ReactNode;
    backUrl?: string;
    floatingButton?: ReactNode;
    upsellButton?: ReactNode;
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
    upsellButton,
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
    useNoBFCookie();

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

    return (
        <Header>
            <div className="logo-container flex flex-justify-space-between flex-align-items-center flex-nowrap no-mobile">
                {logo}
                {AppsDropdownComponent}
            </div>
            <Hamburger expanded={expanded} onToggle={onToggleExpand} />
            {title && isNarrow ? <span className="text-xl lh-rg myauto text-ellipsis">{title}</span> : null}
            {isNarrow ? null : searchBox}
            <TopNavbar>
                <TopNavbarList>
                    {isNarrow && searchDropdown ? <TopNavbarListItem>{searchDropdown}</TopNavbarListItem> : null}
                    {upsellButton !== undefined ? upsellButton : <TopNavbarUpsell />}
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
