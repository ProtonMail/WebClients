import React, { RefObject } from 'react';

import { c } from 'ttag';

import { Dropdown, DropdownMenu, DropdownMenuButton, Icon, useNotifications } from '@proton/components';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';

interface Props {
    email?: string;
    toggle: () => void;
    isOpen: boolean;
    close: () => void;
    anchorRef: RefObject<HTMLButtonElement>;
    isContact: boolean;
    onCreateOrEditContact: () => void;
}

const ParticipantDropdown = ({ email, isContact, anchorRef, isOpen, close, onCreateOrEditContact }: Props) => {
    const { createNotification } = useNotifications();

    const handleCopy = () => {
        textToClipboard(email);
        createNotification({
            type: 'success',
            text: c('Success').t`Email address copied to clipboard`,
        });
    };

    return (
        <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close} originalPlacement="bottom-start">
            <DropdownMenu>
                {!!email && (
                    <DropdownMenuButton className="text-left" onClick={handleCopy}>
                        <Icon name="squares" className="mr-2" />
                        <span className="flex-item-fluid my-auto">{c('Action').t`Copy email address`}</span>
                    </DropdownMenuButton>
                )}
                <DropdownMenuButton className="text-left" onClick={onCreateOrEditContact}>
                    <Icon name={isContact ? 'user' : 'user-plus'} className="mr-2" />
                    <span className="flex-item-fluid my-auto">
                        {isContact ? c('Action').t`View contact details` : c('Action').t`Create new contact`}
                    </span>
                </DropdownMenuButton>
            </DropdownMenu>
        </Dropdown>
    );
};

export default ParticipantDropdown;
