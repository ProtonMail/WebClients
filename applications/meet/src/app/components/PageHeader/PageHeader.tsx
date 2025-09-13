import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import AppsDropdown, { UnAuthenticatedAppsDropdown } from '@proton/components/containers/app/AppsDropdown';
import UserDropdown from '@proton/components/containers/heading/UserDropdown';
import AuthenticatedBugModal from '@proton/components/containers/support/AuthenticatedBugModal';
import BugModal from '@proton/components/containers/support/BugModal';
import { IcBug } from '@proton/icons';
import { isUrlPasswordValid } from '@proton/meet/utils/isUrlPasswordValid';
import { ForkType, requestFork } from '@proton/shared/lib/authentication/fork';
import { APPS } from '@proton/shared/lib/constants';
import logo from '@proton/styles/assets/img/meet/logo-with-name.png';

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

    const handleSignInClick = () => {
        const hash = window.location.hash;

        if (!isUrlPasswordValid(hash)) {
            return window.location.pathname.replace('/guest', '');
        }

        handleSignIn(window.location.pathname.replace('/guest', '') + window.location.hash);
    };

    const buttons = (
        <div className="flex flex-nowrap gap-2 items-center w-custom" style={{ '--w-custom': 'fit-content' }}>
            {guestMode ? <UnAuthenticatedAppsDropdown app={APPS.PROTONMEET} /> : <AppsDropdown app={APPS.PROTONMEET} />}

            <DropdownButton
                as="button"
                className="apps-dropdown-button shrink-0"
                onClick={() => setBugReportModal(true)}
                hasCaret={false}
            >
                <IcBug
                    size={6}
                    className="apps-dropdown-button-icon shrink-0 no-print"
                    alt={c('Alt').t`Report a problem`}
                />
            </DropdownButton>
        </div>
    );

    return (
        <div className="meet-page-header w-full px-4 py-2 md:py-4 flex items-center justify-space-between shrink-0">
            <div className="flex gap-4 items-center">
                <img className="logo cursor-pointer" src={logo} alt="" onClick={() => history.push('/dashboard')} />

                <div className="hidden md:inline-block w-custom" style={{ '--w-custom': 'fit-content' }}>
                    {buttons}
                </div>
            </div>

            <div className="flex flex-nowrap gap-2 items-center">
                {isScheduleInAdvanceEnabled && (
                    <Button
                        className="action-button rounded-full border-none hidden md:block"
                        onClick={() => (guestMode ? handleSignIn('admin/create') : history.replace('/admin/create'))}
                        size="large"
                    >
                        {c('Action').t`Schedule meeting`}
                    </Button>
                )}
                <div className="md:hidden w-custom" style={{ '--w-custom': 'fit-content' }}>
                    {buttons}
                </div>
                {guestMode ? (
                    <Button className="action-button rounded-full border-none" onClick={handleSignInClick} size="large">
                        {c('Action').t`Sign in`}
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
