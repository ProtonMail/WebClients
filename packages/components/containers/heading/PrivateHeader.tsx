import { ReactNode } from 'react';

import { c } from 'ttag';

import { Vr } from '@proton/atoms';
import { APP_NAMES } from '@proton/shared/lib/constants';

import { AppLink, Hamburger, Icon } from '../../components';
import Header, { Props as HeaderProps } from '../../components/header/Header';
import { TopNavbar, TopNavbarList, TopNavbarListItem, TopNavbarUpsell } from '../../components/topnavbar';
import TopNavbarListItemButton from '../../components/topnavbar/TopNavbarListItemButton';
import { useIsPaidUserCookie, useIsProtonUserCookie } from '../../hooks';

interface Props extends HeaderProps {
    settingsButton?: ReactNode;
    userDropdown?: ReactNode;
    contactsButton?: ReactNode;
    feedbackButton?: ReactNode;
    backUrl?: string;
    floatingButton?: ReactNode;
    upsellButton?: ReactNode;
    searchBox?: ReactNode;
    searchDropdown?: ReactNode;
    title: string;
    expanded: boolean;
    onToggleExpand?: () => void;
    isNarrow?: boolean;
    app?: APP_NAMES;
}

const PrivateHeader = ({
    isNarrow,
    upsellButton,
    userDropdown,
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
    app,
}: Props) => {
    useIsPaidUserCookie();
    useIsProtonUserCookie();

    if (backUrl) {
        return (
            <Header>
                <TopNavbarListItemButton
                    data-testid="view:general-back"
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
            <Hamburger expanded={expanded} onToggle={onToggleExpand} />
            {title && isNarrow ? <span className="text-xl lh-rg my-auto text-ellipsis">{title}</span> : null}
            {isNarrow ? null : searchBox}
            <TopNavbar>
                <TopNavbarList>
                    {isNarrow && searchDropdown ? <TopNavbarListItem>{searchDropdown}</TopNavbarListItem> : null}
                    {upsellButton !== undefined ? upsellButton : <TopNavbarUpsell app={app} />}
                    {feedbackButton ? <TopNavbarListItem noShrink>{feedbackButton}</TopNavbarListItem> : null}
                    {contactsButton ? <TopNavbarListItem noShrink>{contactsButton}</TopNavbarListItem> : null}
                    {settingsButton ? <TopNavbarListItem noShrink>{settingsButton}</TopNavbarListItem> : null}
                    {!isNarrow && (
                        <TopNavbarListItem noShrink className="flex-align-self-stretch topnav-vr">
                            <Vr className="h100 mx-4" />
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
