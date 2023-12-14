import { ReactNode } from 'react';

import { APPS, APP_NAMES } from '@proton/shared/lib/constants';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import clsx from '@proton/utils/clsx';

import { Hamburger } from '../../components';
import Header, { Props as HeaderProps } from '../../components/header/Header';
import { TopNavbar, TopNavbarList, TopNavbarListItem, TopNavbarUpsell } from '../../components/topnavbar';
import { useConfig, useIsPaidUserCookie, useIsProtonUserCookie } from '../../hooks';
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
    isSmallViewport?: boolean;
    app?: APP_NAMES;
}

const PrivateHeader = ({
    isSmallViewport,
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

    const { APP_NAME } = useConfig();
    const theme = useTheme();
    const isProminent = theme.information.prominentHeader;

    const isCalendarOnElectron = APP_NAME === APPS.PROTONCALENDAR && isElectronApp();

    return (
        <Header className={clsx(isProminent && 'ui-prominent', isCalendarOnElectron && 'pl-16 md:pl-2')}>
            {!hideMenuButton && <Hamburger expanded={expanded} onToggle={onToggleExpand} />}
            {/* Handle actionArea in components itself rather than here */}
            <div className="flex-1">{actionArea}</div>

            <TopNavbar>
                <TopNavbarList>
                    {upsellButton !== undefined ? upsellButton : !hideUpsellButton && <TopNavbarUpsell app={app} />}
                    {feedbackButton ? <TopNavbarListItem noShrink>{feedbackButton}</TopNavbarListItem> : null}
                    {settingsButton ? (
                        <TopNavbarListItem noShrink className="hidden md:flex">
                            {settingsButton}
                        </TopNavbarListItem>
                    ) : null}
                    {userDropdown && !isSmallViewport ? (
                        <TopNavbarListItem className="relative hidden md:flex">{userDropdown}</TopNavbarListItem>
                    ) : null}
                </TopNavbarList>
            </TopNavbar>
            {isSmallViewport && floatingButton ? floatingButton : null}
        </Header>
    );
};

export default PrivateHeader;
