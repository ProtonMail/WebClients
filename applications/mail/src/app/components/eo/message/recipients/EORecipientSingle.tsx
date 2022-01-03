import { usePopperAnchor } from '@proton/components';
import { Recipient } from '@proton/shared/lib/interfaces';

import RecipientItemSingle from '../../../message/recipients/RecipientItemSingle';

interface Props {
    recipient: Recipient;
    showAddress?: boolean;
}

const EORecipientSingle = ({ recipient, showAddress = true }: Props) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    return (
        <RecipientItemSingle
            recipient={recipient}
            showAddress={showAddress}
            anchorRef={anchorRef}
            isOpen={isOpen}
            toggle={toggle}
            close={close}
            isOutside
        />
    );
};

export default EORecipientSingle;
