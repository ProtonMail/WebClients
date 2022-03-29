import { usePopperAnchor } from '@proton/components';
import { Recipient } from '@proton/shared/lib/interfaces';

import RecipientItemSingle from '../../../message/recipients/RecipientItemSingle';

interface Props {
    recipient: Recipient;
    isRecipient?: boolean;
    isExpanded?: boolean;
}

const EORecipientSingle = ({ recipient, isRecipient, isExpanded }: Props) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    return (
        <RecipientItemSingle
            recipient={recipient}
            anchorRef={anchorRef}
            isOpen={isOpen}
            toggle={toggle}
            close={close}
            isOutside
            isRecipient={isRecipient}
            isExpanded={isExpanded}
        />
    );
};

export default EORecipientSingle;
