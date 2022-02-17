import { c } from 'ttag';

import {
    Button,
    DropdownMenu,
    DropdownMenuButton,
    DropdownMenuLink,
    Icon,
    BugModal,
    useModalState,
} from '@proton/components';

import SimpleDropdown, { Props as SimpleDropdownProps } from '@proton/components/components/dropdown/SimpleDropdown';

interface Props extends Omit<SimpleDropdownProps<typeof Button>, 'as' | 'content'> {}

const VPNSupportDropdown = (props: Props) => {
    const [bugReportModal, setBugReportModal, render] = useModalState();

    const handleBugReportClick = () => {
        setBugReportModal(true);
    };

    return (
        <>
            {render && <BugModal {...bugReportModal} />}
            <SimpleDropdown
                as={Button}
                content={
                    <>
                        <Icon name="life-ring" className="mr0-5" /> {c('Header').t`Help`}
                    </>
                }
                {...props}
            >
                <DropdownMenu>
                    <DropdownMenuLink
                        className="flex flex-nowrap text-left"
                        href="https://protonvpn.com/support/"
                        target="_blank"
                    >
                        <Icon className="mt0-25 mr0-5" name="circle-question" />
                        {c('Action').t`I have a question`}
                    </DropdownMenuLink>
                    <DropdownMenuLink href="https://protonmail.uservoice.com/" target="_blank">
                        <Icon className="mt0-25 mr0-5" name="messages" />
                        {c('Action').t`Request a feature`}
                    </DropdownMenuLink>
                    <DropdownMenuButton className="flex flex-nowrap text-left" onClick={handleBugReportClick}>
                        <Icon className="mt0-25 mr0-5" name="bug" />
                        {c('Action').t`Report bug`}
                    </DropdownMenuButton>
                </DropdownMenu>
            </SimpleDropdown>
        </>
    );
};

export default VPNSupportDropdown;
