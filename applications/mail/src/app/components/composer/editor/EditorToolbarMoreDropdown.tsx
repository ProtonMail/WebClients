import React, { MutableRefObject } from 'react';
import { DropdownMenu, DropdownMenuButton, Icon, useMailSettings, useAddresses, classnames } from 'react-components';
import { c } from 'ttag';
import { MIME_TYPES, RIGHT_TO_LEFT } from 'proton-shared/lib/constants';
import { Address, MailSettings } from 'proton-shared/lib/interfaces';

import EditorToolbarDropdown from './EditorToolbarDropdown';
import { MessageExtended, PartialMessageExtended } from '../../../models/message';
import {
    isPlainText as testIsPlainText,
    isSign as testIsSign,
    isAttachPublicKey as testIsAttachPublicKey,
    isRequestReadReceipt as testIsRequestReadReceipt
} from '../../../helpers/message/messages';
import { SquireType } from '../../../helpers/squire/squireConfig';
import { setTextDirection } from '../../../helpers/squire/squireActions';
import { createEmbeddedMap } from '../../../helpers/embedded/embeddeds';
import { MESSAGE_FLAGS } from '../../../constants';
import { exportPlainText, plainTextToHTML, setDocumentContent } from '../../../helpers/message/messageContent';

const { FLAG_SIGN, FLAG_PUBLIC_KEY, FLAG_RECEIPT_REQUEST } = MESSAGE_FLAGS;

const getClassname = (status: boolean) => (status ? undefined : 'nonvisible');

interface Props {
    message: MessageExtended;
    squireRef: MutableRefObject<SquireType>;
    onChange: (message: PartialMessageExtended) => void;
    onChangeFlag: (changes: Map<number, boolean>) => void;
}

const EditorToolbarMoreDropdown = ({ message, squireRef, onChange, onChangeFlag }: Props) => {
    const [mailSettings] = useMailSettings() as [MailSettings, boolean, Error];
    const [addresses] = useAddresses() as [Address[], boolean, Error];

    const isRtl = !!message.data?.RightToLeft;
    const isPlainText = testIsPlainText(message.data);
    const isSign = testIsSign(message.data);
    const isAttachPublicKey = testIsAttachPublicKey(message.data);
    const isReceiptRequest = testIsRequestReadReceipt(message.data);

    const handleChangeDirection = (RightToLeft: RIGHT_TO_LEFT) => () => {
        onChange({ data: { RightToLeft } });
        // setTimeout prevent a race condition between change of the flag and the content
        setTimeout(() => setTextDirection(squireRef.current, RightToLeft));
    };

    const switchToPlainText = () => {
        const MIMEType = MIME_TYPES.PLAINTEXT;
        const plainText = exportPlainText(message);
        const embeddeds = createEmbeddedMap();
        onChange({ plainText, data: { MIMEType }, embeddeds });
    };

    const switchToHTML = () => {
        const MIMEType = MIME_TYPES.DEFAULT;
        const content = plainTextToHTML(message, mailSettings, addresses);
        const document = setDocumentContent(message.document, content);
        onChange({ document, data: { MIMEType } });
    };

    const handleChangePlainText = (newIsPlainText: boolean) => () => {
        if (isPlainText !== newIsPlainText) {
            if (newIsPlainText) {
                switchToPlainText();
            } else {
                switchToHTML();
            }
        }
    };

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
        <EditorToolbarDropdown className="mlauto">
            <DropdownMenu className="editor-toolbar-more-menu flex-item-noshrink">
                {!isPlainText && [
                    // Fragment breaks the DropdownMenu flow, an array works
                    <DropdownMenuButton
                        key={1}
                        className="alignleft flex flex-nowrap"
                        onClick={handleChangeDirection(RIGHT_TO_LEFT.OFF)}
                    >
                        <Icon name="on" className={classnames(['mt0-25', getClassname(!isRtl)])} />
                        <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Info').t`Left to Right`}</span>
                    </DropdownMenuButton>,
                    <DropdownMenuButton
                        key={2}
                        className="alignleft flex flex-nowrap"
                        onClick={handleChangeDirection(RIGHT_TO_LEFT.ON)}
                    >
                        <Icon name="on" className={classnames(['mt0-25', getClassname(isRtl)])} />
                        <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Info').t`Right to Left`}</span>
                    </DropdownMenuButton>
                ]}
                <DropdownMenuButton
                    className="alignleft flex flex-nowrap noborder-bottom"
                    onClick={handleChangePlainText(false)}
                >
                    <Icon name="on" className={classnames(['mt0-25', getClassname(!isPlainText)])} />
                    <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Info').t`Normal`}</span>
                </DropdownMenuButton>
                <DropdownMenuButton className="alignleft flex flex-nowrap" onClick={handleChangePlainText(true)}>
                    <Icon name="on" className={classnames(['mt0-25', getClassname(isPlainText)])} />
                    <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Info').t`Plain text`}</span>
                </DropdownMenuButton>
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
            </DropdownMenu>
        </EditorToolbarDropdown>
    );
};

export default EditorToolbarMoreDropdown;
