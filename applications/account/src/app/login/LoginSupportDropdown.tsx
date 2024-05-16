import { c } from 'ttag';

import { Href } from '@proton/atoms/Href';
import { BugModal, DropdownMenuButton, DropdownMenuLink, Icon, useFlag, useModalState } from '@proton/components';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import SupportDropdown from '../public/SupportDropdown';

const LoginSupportDropdown = () => {
    const disableLoginPageBugReport = useFlag('DisableLoginPageBugReport');

    const [bugReportModal, setBugReportModal, render] = useModalState();

    const handleBugReportClick = () => {
        setBugReportModal(true);
    };

    if (disableLoginPageBugReport) {
        return (
            <Href className="signup-link link-focus" href={getKnowledgeBaseUrl('/common-login-problems')}>
                {c('Link').t`Help`}
            </Href>
        );
    }

    return (
        <>
            {render && <BugModal {...bugReportModal} />}
            <SupportDropdown
                buttonClassName="mx-auto signup-link color-primary link-focus"
                content={c('Link').t`Need help?`}
            >
                <DropdownMenuLink
                    href={getKnowledgeBaseUrl('/common-login-problems')}
                    target="_blank"
                    className="text-left"
                >
                    <Icon name="speech-bubble" className="mr-2" />
                    {c('Link').t`Common sign in issues`}
                </DropdownMenuLink>
                <DropdownMenuButton className="text-left" onClick={handleBugReportClick}>
                    <Icon name="bug" className="mr-2" />
                    {c('Action').t`Report a problem`}
                </DropdownMenuButton>
            </SupportDropdown>
        </>
    );
};

export default LoginSupportDropdown;
