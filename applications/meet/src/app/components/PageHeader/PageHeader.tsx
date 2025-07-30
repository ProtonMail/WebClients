import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { AppsDropdown, UnAuthenticatedAppsDropdown, UserDropdown } from '@proton/components';
import { ForkType, requestFork } from '@proton/shared/lib/authentication/fork';
import { APPS } from '@proton/shared/lib/constants';

import logo from '../../../assets/logo-with-name.png';

import './PageHeader.scss';

interface PageHeaderProps {
    isScheduleInAdvanceEnabled: boolean;
    guestMode: boolean;
}

export const PageHeader = ({ isScheduleInAdvanceEnabled, guestMode }: PageHeaderProps) => {
    const history = useHistory();

    const handleSignIn = (returnUrl: string) =>
        requestFork({
            fromApp: APPS.PROTONMEET,
            forkType: ForkType.LOGIN,
            extra: {
                returnUrl,
            },
        });

    return (
        <div className="meet-page-header w-full p-4 flex items-center justify-space-between">
            <div className="flex gap-4 items-center">
                <img
                    className="h-custom cursor-pointer"
                    style={{ '--h-custom': '3rem' }}
                    src={logo}
                    alt=""
                    onClick={() => history.push('/dashboard')}
                />

                {guestMode ? (
                    <UnAuthenticatedAppsDropdown app={APPS.PROTONMEET} />
                ) : (
                    <AppsDropdown app={APPS.PROTONMEET} />
                )}
            </div>

            <div className="flex gap-4 items-center">
                {isScheduleInAdvanceEnabled && (
                    <Button
                        className="action-button rounded-full border-none"
                        onClick={() => (guestMode ? handleSignIn('admin/create') : history.replace('/admin/create'))}
                        size="large"
                    >
                        {c('meet_2025 Action').t`Schedule meeting`}
                    </Button>
                )}
                {guestMode ? (
                    <Button
                        className="action-button rounded-full border-none"
                        onClick={() =>
                            handleSignIn(
                                window.location.pathname.replace('/guest', '') +
                                    window.location.search +
                                    window.location.hash
                            )
                        }
                        size="large"
                    >
                        {c('meet_2025 Action').t`Sign in`}
                    </Button>
                ) : (
                    <UserDropdown app={APPS.PROTONMEET} />
                )}
            </div>
        </div>
    );
};
