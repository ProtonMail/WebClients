import { c } from 'ttag';

import { BugModal, DropdownMenuButton, DropdownMenuLink, Icon, useModalState } from '@proton/components';
import { getStaticURL } from '@proton/shared/lib/helpers/url';

import SupportDropdown from './SupportDropdown';

const StandardSupportDropdown = () => {
    const [bugReportModal, setBugReportModal, render] = useModalState();

    const handleBugReportClick = () => {
        setBugReportModal(true);
    };

    return (
        <>
            {render && <BugModal {...bugReportModal} />}
            <SupportDropdown buttonClassName="mx-auto">
                <DropdownMenuLink
                    className="flex flex-nowrap text-left"
                    href={getStaticURL('/support')}
                    target="_blank"
                >
                    <Icon className="mt-1 mr-2" name="question-circle" />
                    {c('Action').t`I have a question`}
                </DropdownMenuLink>
                <DropdownMenuButton className="flex flex-nowrap text-left" onClick={handleBugReportClick}>
                    <Icon className="mt-1 mr-2" name="bug" />
                    {c('Action').t`Report a problem`}
                </DropdownMenuButton>
            </SupportDropdown>
        </>
    );
};

export default StandardSupportDropdown;
