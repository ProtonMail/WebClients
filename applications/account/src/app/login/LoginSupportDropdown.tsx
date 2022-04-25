import { c } from 'ttag';
import { BugModal, DropdownMenuButton, DropdownMenuLink, Icon, useModalState } from '@proton/components';
import { Link } from 'react-router-dom';
import { SSO_PATHS } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import SupportDropdown from '../public/SupportDropdown';

const LoginSupportDropdown = () => {
    const [bugReportModal, setBugReportModal, render] = useModalState();

    const handleBugReportClick = () => {
        setBugReportModal(true);
    };

    return (
        <>
            {render && <BugModal {...bugReportModal} />}
            <SupportDropdown>
                <Link
                    to="/reset-password"
                    className="dropdown-item-link w100 pr1 pl1 pt0-5 pb0-5 block text-no-decoration text-left"
                >
                    <Icon name="user-circle" className="mr0-5" />
                    {c('Link').t`Reset password`}
                </Link>
                <Link
                    to={SSO_PATHS.FORGOT_USERNAME}
                    className="dropdown-item-link w100 pr1 pl1 pt0-5 pb0-5 block text-no-decoration text-left"
                >
                    <Icon name="key" className="mr0-5" />
                    {c('Link').t`Forgot username?`}
                </Link>
                <DropdownMenuLink
                    href={getKnowledgeBaseUrl('/common-login-problems/')}
                    target="_blank"
                    className="text-left"
                >
                    <Icon name="speech-bubble" className="mr0-5" />
                    {c('Link').t`Common sign in issues`}
                </DropdownMenuLink>
                <DropdownMenuButton className="text-left" onClick={handleBugReportClick}>
                    <Icon name="bug" className="mr0-5" />
                    {c('Action').t`Report a problem`}
                </DropdownMenuButton>
            </SupportDropdown>
        </>
    );
};

export default LoginSupportDropdown;
