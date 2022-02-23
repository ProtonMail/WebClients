import { c } from 'ttag';
import { BugModal, DropdownMenuButton, DropdownMenuLink, Icon, useModalState } from '@proton/components';
import SupportDropdown from '../public/SupportDropdown';

const SignupSupportDropdown = () => {
    const [bugReportModal, setBugReportModal, render] = useModalState();

    const handleBugReportClick = () => {
        setBugReportModal(true);
    };

    return (
        <>
            {render && <BugModal {...bugReportModal} />}
            <SupportDropdown>
                <DropdownMenuLink
                    href="https://protonmail.com/support/knowledge-base/common-sign-up-problems-and-solutions/"
                    target="_blank"
                    className="text-left"
                >
                    <Icon name="messages" className="mr0-5" />
                    {c('Link').t`Common sign up issues`}
                </DropdownMenuLink>
                <DropdownMenuButton className="flex flex-nowrap text-left" onClick={handleBugReportClick}>
                    <Icon name="bug" className="mr0-5" />
                    {c('Action').t`Report a problem`}
                </DropdownMenuButton>
            </SupportDropdown>
        </>
    );
};

export default SignupSupportDropdown;
