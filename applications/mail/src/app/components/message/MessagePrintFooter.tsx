import { c, msgid } from 'ttag';

import { FeatureCode, FileNameDisplay, useFeature } from '@proton/components';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { rtlSanitize } from '@proton/shared/lib/helpers/string';
import { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { getAttachments } from '@proton/shared/lib/mail/messages';

import { getAttachmentCounts } from '../../helpers/message/messages';
import { MessageState } from '../../logic/messages/messagesTypes';

interface Props {
    message: MessageState;
}

interface ItemProps {
    attachment: Attachment;
}

const MessagePrintFooterItem = ({ attachment }: ItemProps) => {
    const nameRaw = `${attachment ? attachment.Name : ''}`;
    const name = rtlSanitize(nameRaw);
    const humanAttachmentSize = humanSize(attachment?.Size);

    return (
        <div className="proton-print-footer-item flex flex-nowrap rounded">
            <div className="flex flex-align-items-baseline flex-nowrap">
                <FileNameDisplay text={name} />
                <div className="proton-print-footer-item-size flex-item-noshrink">{humanAttachmentSize}</div>
            </div>
        </div>
    );
};

const MessagePrintFooter = ({ message }: Props) => {
    const isNumAttachmentsWithoutEmbedded = useFeature(FeatureCode.NumAttachmentsWithoutEmbedded).feature?.Value;
    const attachments = getAttachments(message.data);
    const { size, sizeLabel, pureAttachments, pureAttachmentsCount, embeddedAttachmentsCount } = getAttachmentCounts(
        attachments,
        message.messageImages
    );

    const attachmentsToShow = isNumAttachmentsWithoutEmbedded ? pureAttachments : attachments;

    return (
        <div className="proton-print">
            <div className="proton-print-footer">
                <div className="proton-print-footer-sizes flex flex-align-items-center outline-none">
                    {size !== 0 && <strong className="proton-print-footer-sizes-label">{sizeLabel}</strong>}
                    {pureAttachmentsCount > 0 && (
                        <span className="proton-print-footer-sizes-count">
                            <span>{pureAttachmentsCount}</span>&nbsp;
                            <span>
                                {c('Info').ngettext(msgid`file attached`, `files attached`, pureAttachmentsCount)}
                            </span>
                        </span>
                    )}
                    {embeddedAttachmentsCount > 0 && (
                        <span className="proton-print-footer-sizes-embedded-count">
                            <span>{embeddedAttachmentsCount}</span>&nbsp;
                            <span>
                                {c('Info').ngettext(msgid`embedded image`, `embedded images`, embeddedAttachmentsCount)}
                            </span>
                        </span>
                    )}
                </div>
                <div className="proton-print-footer-items flex flex-gap-0-5">
                    {attachmentsToShow.map((attachment) => (
                        <MessagePrintFooterItem key={attachment.ID} attachment={attachment} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MessagePrintFooter;
