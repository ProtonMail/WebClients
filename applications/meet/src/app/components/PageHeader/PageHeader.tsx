import { useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import MeetLogo from '@proton/components/components/logo/MeetLogo';
import AppsDropdown, { UnAuthenticatedAppsDropdown } from '@proton/components/containers/app/AppsDropdown';
import UserDropdown from '@proton/components/containers/heading/UserDropdown';
import { IcCross } from '@proton/icons/icons/IcCross';
import { isUrlPasswordValid } from '@proton/meet/utils/isUrlPasswordValid';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { ForkType, requestFork } from '@proton/shared/lib/authentication/fork';
import { APPS, SSO_PATHS } from '@proton/shared/lib/constants';
import logo from '@proton/styles/assets/img/meet/brand-dual-colors.svg';
import clsx from '@proton/utils/clsx';

import './PageHeader.scss';

interface PageHeaderProps {
    guestMode: boolean;
    showAppSwitcher?: boolean;
    isInstantJoin?: boolean;
}

export const PageHeader = ({ guestMode, showAppSwitcher = true, isInstantJoin = false }: PageHeaderProps) => {
    const location = useLocation();
    const history = useHistory();

    const handleSignIn = (returnUrl: string) =>
        requestFork({
            fromApp: APPS.PROTONMEET,
            forkType: ForkType.LOGIN,
            extra: {
                returnUrl,
            },
        });

    const handleSignInClick = () => {
        const hash = window.location.hash;

        if (hash && !isUrlPasswordValid(hash)) {
            return window.location.pathname.replace('/guest', '');
        }

        handleSignIn(window.location.pathname.replace('/guest', '') + window.location.hash);
    };

    const handleSignUpClick = () => {
        const returnUrl = getAppHref(SSO_PATHS.MEET_SIGNUP, APPS.PROTONACCOUNT);
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

    const buttons = (
        <div className="flex flex-nowrap gap-2 items-center w-custom" style={{ '--w-custom': 'fit-content' }}>
            {showAppSwitcher && !isInstantJoin && (
                <>
                    {guestMode ? (
                        <UnAuthenticatedAppsDropdown app={APPS.PROTONMEET} />
                    ) : (
                        <AppsDropdown app={APPS.PROTONMEET} />
                    )}
                </>
            )}
        </div>
    );

    return (
        <div
            className="meet-page-header w-full py-4 flex items-center justify-space-between shrink-0 h-custom"
            style={{ '--h-custom': '5.625rem' }}
        >
            <div className={clsx('flex items-center', showAppSwitcher ? 'gap-4' : 'gap-2')}>
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
            </div>

            {!isInstantJoin && (
                <div className="flex flex-nowrap gap-2 items-center">
                    <div className="md:hidden w-custom" style={{ '--w-custom': 'fit-content' }}>
                        {buttons}
                    </div>
                    <div>
                        <div className="flex items-center sign-in-header-button-container">
                            {guestMode ? (
                                <>
                                    <Button
                                        className="sign-in-header-button rounded-full py-2"
                                        onClick={handleSignInClick}
                                        size="medium"
                                        shape="ghost"
                                    >
                                        {c('Action').t`Sign in`}
                                    </Button>
                                    <Button
                                        className="create-account-header-button rounded-full py-2"
                                        onClick={handleSignUpClick}
                                        size="medium"
                                        shape="ghost"
                                    >
                                        {c('Action').t`Create an account`}
                                    </Button>
                                </>
                            ) : (
                                <UserDropdown
                                    app={APPS.PROTONMEET}
                                    logoutRedirectUrl={`${location.pathname}${location.hash}`}
                                />
                            )}
                            {(isJoinPage || isSchedulePage) && (
                                <Button
                                    className="action-button w-custom h-custom rounded-full shrink-0 flex items-center justify-center p-0"
                                    onClick={() => history.push('/dashboard')}
                                    size="large"
                                    style={{
                                        '--w-custom': '2.5rem',
                                        '--h-custom': '2.5rem',
                                    }}
                                    icon
                                    aria-label={c('Action').t`Close`}
                                >
                                    <IcCross className="color-hint" size={4} />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
