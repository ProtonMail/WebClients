import React, { MutableRefObject } from 'react';
import { DropdownMenu, DropdownMenuButton, Icon, useMailSettings, useAddresses } from 'react-components';
import { c } from 'ttag';
import { RIGHT_TO_LEFT, MIME_TYPES } from 'proton-shared/lib/constants';
import { Address } from 'proton-shared/lib/interfaces';

import EditorToolbarDropdown from './EditorToolbarDropdown';
import { MessageExtended } from '../../../models/message';
import { hasFlag, toggleFlag, setFlag, isPlainText as testIsPlainText } from '../../../helpers/message/messages';
import { MESSAGE_FLAGS } from '../../../constants';
import { SquireType } from '../../../helpers/squire/squireConfig';
import { setTextDirection } from '../../../helpers/squire/squireActions';
import { createEmbeddedMap } from '../../../helpers/embedded/embeddeds';
import { MailSettings } from '../../../models/utils';
import { exportPlainText, plainTextToHTML, setDocumentContent } from '../../../helpers/message/messageContent';

const { FLAG_SIGN, FLAG_PUBLIC_KEY, FLAG_RECEIPT_REQUEST } = MESSAGE_FLAGS;

const getClassname = (status: boolean) => (status ? undefined : 'nonvisible');

interface Props {
    message: MessageExtended;
    squireRef: MutableRefObject<SquireType>;
    onChange: (message: MessageExtended) => void;
}

const EditorToolbarMoreDropdown = ({ message, squireRef, onChange }: Props) => {
    const [mailSettings] = useMailSettings() as [MailSettings, boolean, Error];
    const [addresses] = useAddresses() as [Address[], boolean, Error];

    const isRtl = !!message.data?.RightToLeft;
    const isPlainText = testIsPlainText(message.data);
    const isSign = (hasFlag(FLAG_SIGN)(message.data) as any) as boolean; // Shame on TS
    const isAttachPublicKey = (hasFlag(FLAG_PUBLIC_KEY)(message.data) as any) as boolean; // Shame on TS
    const isReceiptRequest = (hasFlag(FLAG_RECEIPT_REQUEST)(message.data) as any) as boolean; // Shame on TS

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

    const handleToggleSign = () => onChange({ data: { Flags: toggleFlag(MESSAGE_FLAGS.FLAG_SIGN)(message.data) } });

    const handleTogglePublicKey = () => {
        let Flags = toggleFlag(FLAG_PUBLIC_KEY)(message.data);

        if (hasFlag(FLAG_PUBLIC_KEY)({ Flags })) {
            Flags = setFlag(FLAG_SIGN)({ Flags });
        }

        onChange({ data: { Flags } });
    };

    const handleToggleReceiptRequest = () =>
        onChange({
            data: { Flags: toggleFlag(FLAG_RECEIPT_REQUEST)(message.data) }
        });

    return (
        <EditorToolbarDropdown>
            <DropdownMenu>
                {!isPlainText && (
                    <>
                        <DropdownMenuButton className="alignleft" onClick={handleChangeDirection(RIGHT_TO_LEFT.OFF)}>
                            <Icon name="on" className={getClassname(!isRtl)} /> {c('Info').t`Left to Right`}
                        </DropdownMenuButton>
                        <DropdownMenuButton className="alignleft" onClick={handleChangeDirection(RIGHT_TO_LEFT.ON)}>
                            <Icon name="on" className={getClassname(isRtl)} /> {c('Info').t`Right to Left`}
                        </DropdownMenuButton>
                    </>
                )}
                <>
                    <DropdownMenuButton className="alignleft" onClick={handleChangePlainText(false)}>
                        <Icon name="on" className={getClassname(!isPlainText)} /> {c('Info').t`Normal`}
                    </DropdownMenuButton>
                    <DropdownMenuButton className="alignleft" onClick={handleChangePlainText(true)}>
                        <Icon name="on" className={getClassname(isPlainText)} /> {c('Info').t`Plain text`}
                    </DropdownMenuButton>
                </>
                <DropdownMenuButton className="alignleft" onClick={handleToggleSign}>
                    <Icon name="on" className={getClassname(isSign)} /> {c('Info').t`Sign message`}
                </DropdownMenuButton>
                <DropdownMenuButton className="alignleft" onClick={handleTogglePublicKey}>
                    <Icon name="on" className={getClassname(isAttachPublicKey)} /> {c('Info').t`Attach Public Key`}
                </DropdownMenuButton>
                <DropdownMenuButton className="alignleft" onClick={handleToggleReceiptRequest}>
                    <Icon name="on" className={getClassname(isReceiptRequest)} /> {c('Info').t`Request Read Receipt`}
                </DropdownMenuButton>
            </DropdownMenu>
        </EditorToolbarDropdown>
    );
};

export default EditorToolbarMoreDropdown;
