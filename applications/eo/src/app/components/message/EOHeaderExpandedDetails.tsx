import { Icon } from '@proton/components';
import { c, msgid } from 'ttag';
import ItemDate from 'proton-mail/src/app/components/list/ItemDate';
import { MessageState } from 'proton-mail/src/app/logic/messages/messagesTypes';
import ItemAttachmentIcon from 'proton-mail/src/app/components/list/ItemAttachmentIcon';
import { getAttachmentCounts } from 'proton-mail/src/app/helpers/message/messages';
import { getAttachments } from '@proton/shared/lib/mail/messages';

interface Props {
    message: MessageState;
    labelID: string;
    onAttachmentIconClick: () => void;
}

const EOHeaderExpandedDetails = ({ message, labelID, onAttachmentIconClick }: Props) => {
    const { pureAttachmentsCount, embeddedAttachmentsCount } = getAttachmentCounts(
        getAttachments(message.data),
        message.messageImages
    );

    const attachmentsTexts = [];
    if (pureAttachmentsCount) {
        attachmentsTexts.push(
            c('Info').ngettext(
                msgid`${pureAttachmentsCount} file attached`,
                `${pureAttachmentsCount} files attached`,
                pureAttachmentsCount
            )
        );
    }
    if (embeddedAttachmentsCount) {
        attachmentsTexts.push(
            c('Info').ngettext(
                msgid`${embeddedAttachmentsCount} embedded image`,
                `${embeddedAttachmentsCount} embedded images`,
                embeddedAttachmentsCount
            )
        );
    }
    const attachmentsText = attachmentsTexts.join(', ');

    return (
        <div
            className="message-detailed-header-extra border-top pt0-5"
            data-testid="message:message-expanded-header-extra"
        >
            <div className="mb0-5 flex flex-nowrap">
                <span className="container-to flex">
                    <Icon name="calendar-days" className="mauto" alt={c('Label').t`Date:`} />
                </span>
                <span className="flex-align-self-center mr0-5 text-ellipsis">
                    <ItemDate element={message.data} labelID={labelID} mode="full" />
                </span>
            </div>
            {attachmentsText && (
                <div className="mb0-5 flex flex-nowrap">
                    <span className="container-to flex flex-justify-center flex-align-items-center">
                        <ItemAttachmentIcon element={message.data} onClick={onAttachmentIconClick} />
                    </span>
                    <span className="flex-align-self-center mr0-5 text-ellipsis" title={attachmentsText}>
                        {attachmentsText}
                    </span>
                </div>
            )}
        </div>
    );
};

export default EOHeaderExpandedDetails;
