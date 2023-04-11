import { c } from 'ttag';

import { BugModal, DropdownMenuButton, DropdownMenuLink, Icon, useModalState } from '@proton/components';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

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
                    href={getKnowledgeBaseUrl('/common-sign-up-problems-and-solutions')}
                    target="_blank"
                    className="text-left"
                >
                    <Icon name="speech-bubble" className="mr-2" />
                    {c('Link').t`Common sign up issues`}
                </DropdownMenuLink>
                <DropdownMenuButton className="flex flex-nowrap text-left" onClick={handleBugReportClick}>
                    <Icon name="bug" className="mr-2" />
                    {c('Action').t`Report a problem`}
                </DropdownMenuButton>
            </SupportDropdown>
        </>
    );
};

export default SignupSupportDropdown;
