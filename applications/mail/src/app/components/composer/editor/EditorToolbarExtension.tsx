import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';
import {
    isAttachPublicKey as testIsAttachPublicKey,
    isRequestReadReceipt as testIsRequestReadReceipt,
} from '@proton/shared/lib/mail/messages';
import { memo } from 'react';
import { DropdownMenuButton, Icon, classnames } from '@proton/components';
import { c } from 'ttag';

import { MessageChangeFlag } from '../Composer';

const { FLAG_PUBLIC_KEY, FLAG_RECEIPT_REQUEST } = MESSAGE_FLAGS;

const getClassname = (status: boolean) => (status ? undefined : 'visibility-hidden');

interface Props {
    message: Message | undefined;
    onChangeFlag: MessageChangeFlag;
}

const EditorToolbarExtension = ({ message, onChangeFlag }: Props) => {
    const isAttachPublicKey = testIsAttachPublicKey(message);
    const isReceiptRequest = testIsRequestReadReceipt(message);

    const handleTogglePublicKey = async () => {
        const changes = new Map([[FLAG_PUBLIC_KEY, !isAttachPublicKey]]);
        onChangeFlag(changes);
    };

    const handleToggleReceiptRequest = () => onChangeFlag(new Map([[FLAG_RECEIPT_REQUEST, !isReceiptRequest]]));

    return (
        <>
            <DropdownMenuButton className="text-left flex flex-nowrap" onClick={handleTogglePublicKey}>
                <span className="mtauto mbauto flex-item-fluid pl0-25">{c('Info').t`Attach public key`}</span>
                <Icon name="check" className={classnames(['mt0-25 ml1', getClassname(isAttachPublicKey)])} />
            </DropdownMenuButton>
            <DropdownMenuButton className="text-left flex flex-nowrap" onClick={handleToggleReceiptRequest}>
                <span className="mtauto mbauto flex-item-fluid pl0-25">{c('Info').t`Request read receipt`}</span>
                <Icon name="check" className={classnames(['mt0-25 ml1', getClassname(isReceiptRequest)])} />
            </DropdownMenuButton>
        </>
    );
};

export default memo(EditorToolbarExtension);
