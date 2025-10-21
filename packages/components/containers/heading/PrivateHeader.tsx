import type { ReactNode } from 'react';

import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import clsx from '@proton/utils/clsx';

import type { Props as HeaderProps } from '../../components/header/Header';
import Header from '../../components/header/Header';
import Hamburger from '../../components/sidebar/Hamburger';
import TopNavbar from '../../components/topnavbar/TopNavbar';
import TopNavbarB2BOnboardingButton from '../../components/topnavbar/TopNavbarB2BOnboardingButton';
import TopNavbarList from '../../components/topnavbar/TopNavbarList';
import TopNavbarListItem from '../../components/topnavbar/TopNavbarListItem';
import TopNavbarUpsell from '../../components/topnavbar/TopNavbarUpsell';
import useSubscriptionStateCookie from '../../hooks/subscriptionStateCookie/useSubscriptionStateCookie';
import useConfig from '../../hooks/useConfig';
import useIsPaidUserCookie from '../../hooks/useIsPaidUserCookie';

interface Props extends HeaderProps {
    settingsButton?: ReactNode;
    hideSettingsButton?: boolean;
    userDropdown?: ReactNode;
    feedbackButton?: ReactNode;
    floatingButton?: ReactNode;
    upsellButton?: ReactNode;
    hideMenuButton?: boolean;
    hideUpsellButton?: boolean;
    actionArea?: ReactNode;
    expanded: boolean;
    onToggleExpand?: () => void;
    isSmallViewport?: boolean;
    app: APP_NAMES;
}

const PrivateHeader = ({
    isSmallViewport,
    upsellButton,
    userDropdown,
    settingsButton,
    hideSettingsButton = false,
    feedbackButton,
    actionArea,
    floatingButton,
    expanded,
    onToggleExpand,
    hideMenuButton = false,
    hideUpsellButton = false,
    app,
    className,
}: Props) => {
    useSubscriptionStateCookie();
    useIsPaidUserCookie();

    const { APP_NAME } = useConfig();
    const theme = useTheme();
    const isProminent = theme.information.prominentHeader;

    const isCalendarOnElectron = APP_NAME === APPS.PROTONCALENDAR && isElectronMail;

    return (
        <Header className={clsx(isProminent && 'ui-prominent', isCalendarOnElectron && 'pl-16 md:pl-2', className)}>
            {!hideMenuButton && <Hamburger expanded={expanded} onToggle={onToggleExpand} />}
            {/* Handle actionArea in components itself rather than here */}
            <div className="flex-1 flex items-center">{actionArea}</div>

            <TopNavbar>
                <TopNavbarList>
                    {!isSmallViewport && <TopNavbarB2BOnboardingButton />}
                    {upsellButton !== undefined ? upsellButton : !hideUpsellButton && <TopNavbarUpsell app={app} />}
                    {feedbackButton ? <TopNavbarListItem noShrink>{feedbackButton}</TopNavbarListItem> : null}
                    {settingsButton && !hideSettingsButton ? (
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
