import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { MESSAGE_FLAGS } from 'proton-shared/lib/mail/constants';
import {
    isAttachPublicKey as testIsAttachPublicKey,
    isRequestReadReceipt as testIsRequestReadReceipt,
} from 'proton-shared/lib/mail/messages';
import React, { memo } from 'react';
import { DropdownMenuButton, Icon, classnames } from 'react-components';
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
                <Icon name="on" className={classnames(['mt0-25', getClassname(isAttachPublicKey)])} />
                <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Info').t`Attach Public Key`}</span>
            </DropdownMenuButton>
            <DropdownMenuButton className="text-left flex flex-nowrap" onClick={handleToggleReceiptRequest}>
                <Icon name="on" className={classnames(['mt0-25', getClassname(isReceiptRequest)])} />
                <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Info').t`Request Read Receipt`}</span>
            </DropdownMenuButton>
        </>
    );
};

export default memo(EditorToolbarExtension);
