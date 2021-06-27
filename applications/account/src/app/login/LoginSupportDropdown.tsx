import { c } from 'ttag';
import { BugModal, DropdownMenuButton, DropdownMenuLink, Icon, useModals } from '@proton/components';
import { Link } from 'react-router-dom';
import SupportDropdown from '../public/SupportDropdown';

const LoginSupportDropdown = () => {
    const { createModal } = useModals();

    const handleBugReportClick = () => {
        createModal(<BugModal />);
    };

    return (
        <SupportDropdown>
            <Link
                to="/reset-password"
                className="dropdown-item-link w100 pr1 pl1 pt0-5 pb0-5 block text-no-decoration text-left"
            >
                <Icon name="circle-user" className="mr0-5" />
                {c('Link').t`Reset password`}
            </Link>
            <Link
                to="/forgot-username"
                className="dropdown-item-link w100 pr1 pl1 pt0-5 pb0-5 block text-no-decoration text-left"
            >
                <Icon name="key" className="mr0-5" />
                {c('Link').t`Forgot username?`}
            </Link>
            <DropdownMenuLink
                href="https://protonmail.com/support/knowledge-base/common-login-problems/"
                target="_blank"
                className="text-left"
            >
                <Icon name="messages" className="mr0-5" />
                {c('Link').t`Common sign in issues`}
            </DropdownMenuLink>
            <DropdownMenuButton className="text-left" onClick={handleBugReportClick}>
                <Icon name="bug" className="mr0-5" />
                {c('Action').t`Report a problem`}
            </DropdownMenuButton>
        </SupportDropdown>
    );
};

export default LoginSupportDropdown;
