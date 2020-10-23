import React, { useState } from 'react';
import { c } from 'ttag';
import { APPS } from 'proton-shared/lib/constants';
import { Icon, Dropdown, DropdownMenu, DropdownMenuButton, DropdownMenuLink, usePopperAnchor } from '../../components';
import { useModals, useAuthentication, useConfig } from '../../hooks';

import BugModal from '../support/BugModal';
import AuthenticatedBugModal from '../support/AuthenticatedBugModal';
import SupportDropdownButton from './SupportDropdownButton';
import { generateUID } from '../../helpers';
import { OnboardingModal } from '../onboarding';

interface Props {
    className?: string;
    content?: string;
    hasButtonCaret?: boolean;
}

const SupportDropdown = ({ className, content, hasButtonCaret = false }: Props) => {
    const { UID } = useAuthentication();
    const { APP_NAME } = useConfig();
    const { createModal } = useModals();
    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const isAuthenticated = !!UID;

    const handleBugReportClick = () => {
        createModal(isAuthenticated ? <AuthenticatedBugModal /> : <BugModal />);
    };

    const handleTourClick = () => {
        createModal(<OnboardingModal showGenericSteps />);
    };

    return (
        <>
            <SupportDropdownButton
                className={className}
                content={content}
                aria-describedby={uid}
                buttonRef={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
                noCaret={!hasButtonCaret}
            />
            <Dropdown id={uid} isOpen={isOpen} anchorRef={anchorRef} onClose={close} originalPlacement="bottom">
                <DropdownMenu>
                    <DropdownMenuLink
                        className="flex flex-nowrap alignleft"
                        href={
                            APP_NAME === APPS.PROTONVPN_SETTINGS
                                ? 'https://protonvpn.com/support/'
                                : 'https://protonmail.com/support/'
                        }
                        // eslint-disable-next-line react/jsx-no-target-blank
                        target="_blank"
                    >
                        <Icon className="mt0-25 mr0-5" name="what-is-this" />
                        {c('Action').t`I have a question`}
                    </DropdownMenuLink>
                    <DropdownMenuButton className="flex flex-nowrap alignleft" onClick={handleBugReportClick}>
                        <Icon className="mt0-25 mr0-5" name="report-bug" />
                        {c('Action').t`Report bug`}
                    </DropdownMenuButton>
                    <DropdownMenuButton className="flex flex-nowrap alignleft" onClick={handleTourClick}>
                        <Icon className="mt0-25 mr0-5" name="tutorial" />
                        {c('Action').t`Take a tour`}
                    </DropdownMenuButton>
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

export default SupportDropdown;
