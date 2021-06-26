import { c } from 'ttag';
import React from 'react';
import { BugModal, DropdownMenuButton, DropdownMenuLink, Icon, useModals } from 'react-components';
import SupportDropdown from './SupportDropdown';

const StandardSupportDropdown = () => {
    const { createModal } = useModals();

    const handleBugReportClick = () => {
        createModal(<BugModal />);
    };

    return (
        <SupportDropdown>
            <DropdownMenuLink
                className="flex flex-nowrap text-left"
                href="https://protonmail.com/support/"
                target="_blank"
            >
                <Icon className="mt0-25 mr0-5" name="what-is-this" />
                {c('Action').t`I have a question`}
            </DropdownMenuLink>
            <DropdownMenuButton className="flex flex-nowrap text-left" onClick={handleBugReportClick}>
                <Icon className="mt0-25 mr0-5" name="report-bug" />
                {c('Action').t`Report a problem`}
            </DropdownMenuButton>
        </SupportDropdown>
    );
};

export default StandardSupportDropdown;
