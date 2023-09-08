import { ReactNode } from 'react';

import { APP_NAMES } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { Hamburger } from '../../components';
import Header, { Props as HeaderProps } from '../../components/header/Header';
import { TopNavbar, TopNavbarList, TopNavbarListItem, TopNavbarUpsell } from '../../components/topnavbar';
import { useIsPaidUserCookie, useIsProtonUserCookie } from '../../hooks';
import { useTheme } from '../themes';

interface Props extends HeaderProps {
    settingsButton?: ReactNode;
    userDropdown?: ReactNode;
    contactsButton?: ReactNode;
    feedbackButton?: ReactNode;
    floatingButton?: ReactNode;
    upsellButton?: ReactNode;
    hideMenuButton?: boolean;
    hideUpsellButton?: boolean;
    actionArea?: ReactNode;
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
    feedbackButton,
    actionArea,
    floatingButton,
    expanded,
    onToggleExpand,
    hideMenuButton = false,
    hideUpsellButton = false,
    app,
}: Props) => {
    useIsPaidUserCookie();
    useIsProtonUserCookie();

    const theme = useTheme();
    const isProminent = theme.information.prominentHeader;

    return (
        <Header className={clsx(isProminent && 'ui-prominent')}>
            {!hideMenuButton && <Hamburger expanded={expanded} onToggle={onToggleExpand} />}
            {/* Handle actionArea in components itself rather than here */}
            <div className="flex-item-fluid">{actionArea}</div>

            <TopNavbar>
                <TopNavbarList>
                    {upsellButton !== undefined ? upsellButton : !hideUpsellButton && <TopNavbarUpsell app={app} />}
                    {feedbackButton ? <TopNavbarListItem noShrink>{feedbackButton}</TopNavbarListItem> : null}
                    {settingsButton ? (
                        <TopNavbarListItem noShrink className="no-mobile">
                            {settingsButton}
                        </TopNavbarListItem>
                    ) : null}
                    {userDropdown && !isNarrow ? (
                        <TopNavbarListItem className="relative no-mobile">{userDropdown}</TopNavbarListItem>
                    ) : null}
                </TopNavbarList>
            </TopNavbar>
            {isNarrow && floatingButton ? floatingButton : null}
        </Header>
    );
};

export default PrivateHeader;
