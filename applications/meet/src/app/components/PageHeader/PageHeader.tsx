import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    AppsDropdown,
    AuthenticatedBugModal,
    BugModal,
    UnAuthenticatedAppsDropdown,
    UserDropdown,
    useModalState,
} from '@proton/components';
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

    const [bugReportModal, setBugReportModal, renderBugReportModal] = useModalState();

    const handleSignIn = (returnUrl: string) =>
        requestFork({
            fromApp: APPS.PROTONMEET,
            forkType: ForkType.LOGIN,
            extra: {
                returnUrl,
            },
        });

    return (
        <div className="meet-page-header w-full px-4 py-2 md:py-4 flex items-center justify-space-between shrink-0">
            <div className="flex gap-4 items-center">
                <img className="logo cursor-pointer" src={logo} alt="" onClick={() => history.push('/dashboard')} />

                <div className="hidden md:block">
                    {guestMode ? (
                        <UnAuthenticatedAppsDropdown app={APPS.PROTONMEET} />
                    ) : (
                        <AppsDropdown app={APPS.PROTONMEET} />
                    )}
                </div>
            </div>

            <div className="flex gap-4 items-center">
                <Button
                    className="action-button rounded-full border-none hidden lg:block"
                    onClick={() => setBugReportModal(true)}
                    size="large"
                >
                    {c('meet_2025 Action').t`Contact support`}
                </Button>
                {isScheduleInAdvanceEnabled && (
                    <Button
                        className="action-button rounded-full border-none hidden md:block"
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
            {renderBugReportModal && (
                <>
                    {guestMode ? (
                        <BugModal app={APPS.PROTONMEET} {...bugReportModal} />
                    ) : (
                        <AuthenticatedBugModal app={APPS.PROTONMEET} {...bugReportModal} />
                    )}
                </>
            )}
        </div>
    );
};
