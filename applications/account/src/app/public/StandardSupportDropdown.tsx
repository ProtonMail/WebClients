import { c } from 'ttag';
import { BugModal, DropdownMenuButton, DropdownMenuLink, Icon, useModalState } from '@proton/components';
import SupportDropdown from './SupportDropdown';

const StandardSupportDropdown = () => {
    const [bugReportModal, setBugReportModal, render] = useModalState();

    const handleBugReportClick = () => {
        setBugReportModal(true);
    };

    return (
        <>
            {render && <BugModal {...bugReportModal} />}
            <SupportDropdown>
                <DropdownMenuLink
                    className="flex flex-nowrap text-left"
                    href="https://protonmail.com/support/"
                    target="_blank"
                >
                    <Icon className="mt0-25 mr0-5" name="circle-question" />
                    {c('Action').t`I have a question`}
                </DropdownMenuLink>
                <DropdownMenuButton className="flex flex-nowrap text-left" onClick={handleBugReportClick}>
                    <Icon className="mt0-25 mr0-5" name="bug" />
                    {c('Action').t`Report a problem`}
                </DropdownMenuButton>
            </SupportDropdown>
        </>
    );
};

export default StandardSupportDropdown;
