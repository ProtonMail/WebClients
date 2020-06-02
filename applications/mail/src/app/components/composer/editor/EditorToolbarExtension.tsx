import React from 'react';
import { DropdownMenuButton, Icon, classnames } from 'react-components';
import { c } from 'ttag';

import { MessageExtended } from '../../../models/message';
import {
    isSign as testIsSign,
    isAttachPublicKey as testIsAttachPublicKey,
    isRequestReadReceipt as testIsRequestReadReceipt
} from '../../../helpers/message/messages';
import { MESSAGE_FLAGS } from '../../../constants';

const { FLAG_SIGN, FLAG_PUBLIC_KEY, FLAG_RECEIPT_REQUEST } = MESSAGE_FLAGS;

const getClassname = (status: boolean) => (status ? undefined : 'nonvisible');

interface Props {
    message: MessageExtended;
    onChangeFlag: (changes: Map<number, boolean>) => void;
}

const EditorToolbarExtension = ({ message, onChangeFlag }: Props) => {
    const isSign = testIsSign(message.data);
    const isAttachPublicKey = testIsAttachPublicKey(message.data);
    const isReceiptRequest = testIsRequestReadReceipt(message.data);

    const handleToggleSign = () => onChangeFlag(new Map([[FLAG_SIGN, !isSign]]));

    const handleTogglePublicKey = async () => {
        const changes = new Map([[FLAG_PUBLIC_KEY, !isAttachPublicKey]]);
        if (!isAttachPublicKey) {
            changes.set(FLAG_SIGN, true);
        }
        onChangeFlag(changes);
    };

    const handleToggleReceiptRequest = () => onChangeFlag(new Map([[FLAG_RECEIPT_REQUEST, !isReceiptRequest]]));

    return (
        <>
            <DropdownMenuButton className="alignleft flex flex-nowrap" onClick={handleToggleSign}>
                <Icon name="on" className={classnames(['mt0-25', getClassname(isSign)])} />
                <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Info').t`Sign message`}</span>
            </DropdownMenuButton>
            <DropdownMenuButton className="alignleft flex flex-nowrap" onClick={handleTogglePublicKey}>
                <Icon name="on" className={classnames(['mt0-25', getClassname(isAttachPublicKey)])} />
                <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Info').t`Attach Public Key`}</span>
            </DropdownMenuButton>
            <DropdownMenuButton className="alignleft flex flex-nowrap" onClick={handleToggleReceiptRequest}>
                <Icon name="on" className={classnames(['mt0-25', getClassname(isReceiptRequest)])} />
                <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Info').t`Request Read Receipt`}</span>
            </DropdownMenuButton>
        </>
    );
};

export default EditorToolbarExtension;
