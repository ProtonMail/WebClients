import { MouseEvent } from 'react';
import { c } from 'ttag';

import { DropdownMenuButton, Icon, useNotifications, usePopperAnchor } from '@proton/components';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import { Recipient } from '@proton/shared/lib/interfaces';

import RecipientItemSingle from '../../../message/recipients/RecipientItemSingle';

interface Props {
    recipient: Recipient;
    showAddress?: boolean;
}

const EORecipientSingle = ({ recipient, showAddress = true }: Props) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const { createNotification } = useNotifications();

    const handleCopy = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        textToClipboard(recipient.Address, event.currentTarget);
        createNotification({ text: c('Info').t`Copied to clipboard` });
        close();
    };

    const dropdownActions = (
        <>
            <DropdownMenuButton className="text-left flex flex-nowrap" onClick={handleCopy}>
                <Icon name="copy" className="mr0-5 mt0-25" />
                <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Copy address`}</span>
            </DropdownMenuButton>
        </>
    );

    return (
        <RecipientItemSingle
            recipient={recipient}
            dropdownActions={dropdownActions}
            anchorRef={anchorRef}
            isOpen={isOpen}
            toggle={toggle}
            close={close}
            showAddress={showAddress}
            isOutside
        />
    );
};

export default EORecipientSingle;
