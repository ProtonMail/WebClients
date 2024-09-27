import { c, msgid } from 'ttag';

import { FileNameDisplay } from '@proton/components';
import { FeatureCode, useFeature } from '@proton/features';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { rtlSanitize } from '@proton/shared/lib/helpers/string';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { getAttachments } from '@proton/shared/lib/mail/messages';

import { getAttachmentCounts } from '../../helpers/message/messages';
import type { MessageState } from '../../store/messages/messagesTypes';

interface Props {
    message: MessageState;
}

interface ItemProps {
    attachment: Attachment;
}

const MessagePrintFooterItem = ({ attachment }: ItemProps) => {
    const nameRaw = `${attachment ? attachment.Name : ''}`;
    const name = rtlSanitize(nameRaw);
    const humanAttachmentSize = humanSize({ bytes: attachment?.Size });

    return (
        <div className="proton-print-footer-item flex flex-wrap items-baseline rounded max-w-full">
            <FileNameDisplay text={name} className="proton-print-footer-item-filename mr-1" />
            <div className="proton-print-footer-item-size shrink-0">{humanAttachmentSize}</div>
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
                <div className="proton-print-footer-sizes flex items-center outline-none">
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
                <div className="proton-print-footer-items flex gap-2">
                    {attachmentsToShow.map((attachment) => (
                        <MessagePrintFooterItem key={attachment.ID} attachment={attachment} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MessagePrintFooter;
