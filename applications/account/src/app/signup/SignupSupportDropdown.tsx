import { c } from 'ttag';

import { BugModal, DropdownMenuButton, DropdownMenuLink, useModalState } from '@proton/components';
import { IcBug } from '@proton/icons/icons/IcBug';
import { IcSpeechBubble } from '@proton/icons/icons/IcSpeechBubble';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import clsx from '@proton/utils/clsx';

import SupportDropdown from '../public/SupportDropdown';

interface Props {
    isDarkBg?: boolean;
}

const SignupSupportDropdown = ({ isDarkBg }: Props) => {
    const [bugReportModal, setBugReportModal, render] = useModalState();

    const handleBugReportClick = () => {
        setBugReportModal(true);
    };

    return (
        <>
            {render && <BugModal {...bugReportModal} />}
            <SupportDropdown buttonClassName={clsx('signup-link link-focus', isDarkBg && 'color-norm opacity-70')}>
                <DropdownMenuLink
                    href={getKnowledgeBaseUrl('/common-sign-up-problems-and-solutions')}
                    target="_blank"
                    className="text-left"
                >
                    <IcSpeechBubble className="mr-2" />
                    {c('Link').t`Common sign up issues`}
                </DropdownMenuLink>
                <DropdownMenuButton className="flex flex-nowrap text-left" onClick={handleBugReportClick}>
                    <IcBug className="mr-2" />
                    {c('Action').t`Report a problem`}
                </DropdownMenuButton>
            </SupportDropdown>
        </>
    );
};

export default SignupSupportDropdown;
