import type { RefObject } from 'react';

import { c } from 'ttag';

import { Dropdown, DropdownMenu, DropdownMenuButton, useNotifications } from '@proton/components';
import { IcSquares } from '@proton/icons/icons/IcSquares';
import { IcUser } from '@proton/icons/icons/IcUser';
import { IcUserPlus } from '@proton/icons/icons/IcUserPlus';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';

interface Props {
    email?: string;
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
                        <IcSquares className="mr-2" />
                        <span className="flex-1 my-auto">{c('Action').t`Copy email address`}</span>
                    </DropdownMenuButton>
                )}
                <DropdownMenuButton className="text-left" onClick={onCreateOrEditContact}>
                    {isContact ? <IcUser className="mr-2" /> : <IcUserPlus className="mr-2" />}
                    <span className="flex-1 my-auto">
                        {isContact ? c('Action').t`View contact details` : c('Action').t`Create new contact`}
                    </span>
                </DropdownMenuButton>
            </DropdownMenu>
        </Dropdown>
    );
};

export default ParticipantDropdown;
