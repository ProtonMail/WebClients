import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import MeetLogo from '@proton/components/components/logo/MeetLogo';
import AppsDropdown, { UnAuthenticatedAppsDropdown } from '@proton/components/containers/app/AppsDropdown';
import UserDropdown from '@proton/components/containers/heading/UserDropdown';
import { isUrlPasswordValid } from '@proton/meet/utils/isUrlPasswordValid';
import { ForkType, requestFork } from '@proton/shared/lib/authentication/fork';
import { APPS } from '@proton/shared/lib/constants';
import logo from '@proton/styles/assets/img/meet/logo-with-name.png';
import clsx from '@proton/utils/clsx';

import { UpgradeButton } from '../UpgradeButton/UpgradeButton';

import './PageHeader.scss';

interface PageHeaderProps {
    isScheduleInAdvanceEnabled: boolean;
    guestMode: boolean;
    showAppSwitcher?: boolean;
    isInstantJoin?: boolean;
}

export const PageHeader = ({
    isScheduleInAdvanceEnabled,
    guestMode,
    showAppSwitcher = true,
    isInstantJoin = false,
}: PageHeaderProps) => {
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
                    <img className="logo cursor-pointer " src={logo} alt="" />
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
                    {isScheduleInAdvanceEnabled && (
                        <Button
                            className="action-button rounded-full hidden md:block"
                            onClick={() =>
                                guestMode ? handleSignIn('admin/create') : history.replace('/admin/create')
                            }
                            size="large"
                        >
                            {c('Action').t`Schedule meeting`}
                        </Button>
                    )}
                    <div className="md:hidden w-custom" style={{ '--w-custom': 'fit-content' }}>
                        {buttons}
                    </div>
                    {guestMode ? (
                        <Button
                            className="action-button rounded-full mr-2 md:mr-0"
                            onClick={handleSignInClick}
                            size="large"
                        >
                            {c('Action').t`Sign in`}
                        </Button>
                    ) : (
                        <div className="flex items-center gap-2 mr-2 md:mr-0">
                            <UpgradeButton />
                            <UserDropdown app={APPS.PROTONMEET} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
