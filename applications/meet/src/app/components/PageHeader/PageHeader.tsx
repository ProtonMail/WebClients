import { useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import MeetLogo from '@proton/components/components/logo/MeetLogo';
import AppsDropdown, { UnAuthenticatedAppsDropdown } from '@proton/components/containers/app/AppsDropdown';
import { openLinkInBrowser } from '@proton/components/containers/desktop/openExternalLink';
import UserDropdown from '@proton/components/containers/heading/UserDropdown';
import { IcQuestionCircle } from '@proton/icons/icons/IcQuestionCircle';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectIsGuest } from '@proton/meet/store/slices/userSlice';
import { TelemetryMeetDashboardEvents, sendMeetDashboardEvent } from '@proton/meet/telemetry/meetTelemetry';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { ForkType, requestFork } from '@proton/shared/lib/authentication/fork';
import { stripLocalBasenameFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';
import { APPS, SSO_PATHS } from '@proton/shared/lib/constants';
import { isElectronMeet } from '@proton/shared/lib/helpers/desktop';
import logo from '@proton/styles/assets/img/meet/brand-dual-colors.svg';
import clsx from '@proton/utils/clsx';

import { CloseButton } from '../../atoms/CloseButton/CloseButton';
import { useHelpAndFeedback } from '../../hooks/useHelpAndFeedback';
import { MeetSignIn } from '../SignIn/SignIn';
import { SettingsDropdown } from './SettingsDropdown';

import './PageHeader.scss';

const QUESTION_CIRCLE_CENTERED_VIEW_BOX = '0.5 0.5 16 16';

interface PageHeaderProps {
    showAppSwitcher?: boolean;
    isInstantJoin?: boolean;
}

export const PageHeader = ({ showAppSwitcher = true, isInstantJoin = false }: PageHeaderProps) => {
    const location = useLocation();
    const history = useHistory();
    const isGuest = useMeetSelector(selectIsGuest);
    const helpAndFeedback = useHelpAndFeedback();

    const handleSignUpClick = () => {
        const returnUrl = getAppHref(SSO_PATHS.MEET_SIGNUP, APPS.PROTONACCOUNT);
        if (isElectronMeet) {
            openLinkInBrowser(returnUrl);
            return;
        }
        requestFork({
            fromApp: APPS.PROTONMEET,
            forkType: ForkType.SIGNUP,
            extra: {
                returnUrl,
            },
        });
    };

    const isJoinPage = window.location.pathname.includes('join');
    const isSchedulePage = window.location.pathname.includes('schedule');

    // On the pre-join page, switching/adding an account should bring the user back to the same
    // meeting link instead of dropping them on the dashboard. The path is computed without the local
    // account basename so it can be re-based onto the account the user switches to.
    const switchAccountReturnPath = isJoinPage
        ? stripLocalBasenameFromPathname(window.location.pathname) + window.location.search + window.location.hash
        : undefined;

    const logoutRedirectUrl = location.pathname.includes('manage-recordings')
        ? '/dashboard'
        : `${location.pathname}${location.hash}`;

    const buttons = (
        <div className="flex flex-nowrap gap-2 items-center w-custom" style={{ '--w-custom': 'fit-content' }}>
            {showAppSwitcher && !isInstantJoin && (
                <>
                    {isGuest ? (
                        <UnAuthenticatedAppsDropdown app={APPS.PROTONMEET} />
                    ) : (
                        <AppsDropdown app={APPS.PROTONMEET} />
                    )}
                </>
            )}
        </div>
    );

    return (
        <>
            <a href="#main-content" className="skip-to-content">
                {c('Action').t`Skip to main content`}
            </a>
            <header
                className="meet-page-header w-full py-4 flex items-center justify-space-between shrink-0 h-custom"
                style={{ '--h-custom': '5.625rem' }}
            >
                <nav
                    className={clsx('flex items-center', showAppSwitcher ? 'gap-4' : 'gap-2')}
                    aria-label={c('Aria').t`Primary navigation`}
                >
                    <button
                        className="logo-button rounded-full hidden md:block p-2"
                        onClick={() => history.push('/dashboard')}
                        aria-label={c('Alt').t`Go to dashboard`}
                    >
                        <img className="logo cursor-pointer" src={logo} alt="" />
                    </button>
                    <button
                        className="logo-button interactive rounded-full block md:hidden p-1 flex items-center justify-center"
                        onClick={() => history.push('/dashboard')}
                        aria-label={c('Alt').t`Go to dashboard`}
                    >
                        <MeetLogo variant="glyph-only" className="logo cursor-pointer" />
                    </button>

                    <div className="hidden md:inline-block w-fit-content">{buttons}</div>
                </nav>

                {!isInstantJoin && (
                    <div className="flex flex-nowrap gap-2 items-center">
                        <div className="md:hidden w-custom" style={{ '--w-custom': 'fit-content' }}>
                            {buttons}
                        </div>
                        <div>
                            <div className="flex items-center sign-in-header-button-container">
                                {isGuest ? (
                                    <>
                                        <MeetSignIn
                                            className="sign-in-header-button rounded-full py-2"
                                            onClick={() =>
                                                sendMeetDashboardEvent(TelemetryMeetDashboardEvents.sign_in_clicked, {
                                                    source: isJoinPage ? 'prejoin' : 'guest_dashboard',
                                                })
                                            }
                                        >
                                            {c('Action').t`Sign in`}
                                        </MeetSignIn>
                                        <Button
                                            className="create-account-header-button rounded-full py-2"
                                            onClick={handleSignUpClick}
                                            size="medium"
                                            shape="ghost"
                                        >
                                            {c('Action').t`Create an account`}
                                        </Button>
                                        <Tooltip title={c('Action').t`Help and feedback`}>
                                            <Button
                                                shape="ghost"
                                                className="settings-button settings-button-icon p-0 flex items-center justify-center"
                                                aria-label={c('Action').t`Help and feedback`}
                                                onClick={helpAndFeedback.openHelpAndFeedback}
                                            >
                                                <IcQuestionCircle
                                                    size={5}
                                                    viewBox={QUESTION_CIRCLE_CENTERED_VIEW_BOX}
                                                    color="var(--icon-color)"
                                                />
                                            </Button>
                                        </Tooltip>
                                    </>
                                ) : (
                                    <>
                                        <UserDropdown
                                            app={APPS.PROTONMEET}
                                            logoutRedirectUrl={logoutRedirectUrl}
                                            extraSessionForkData={{ returnUrl: switchAccountReturnPath }}
                                            sessionOptions={
                                                switchAccountReturnPath
                                                    ? { path: switchAccountReturnPath, target: '_self' }
                                                    : undefined
                                            }
                                        />
                                        <SettingsDropdown />
                                    </>
                                )}
                                {(isJoinPage || isSchedulePage) && (
                                    <CloseButton onClose={() => history.push('/dashboard')} />
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </header>
            {helpAndFeedback.modals}
        </>
    );
};
