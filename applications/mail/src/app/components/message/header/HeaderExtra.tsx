import { useMailSettings } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { isFrozenExpiration, isReceived, isScheduled } from '@proton/shared/lib/mail/messages';

import { getMessageHasData } from '../../../helpers/message/messages';
import { MessageState } from '../../../logic/messages/messagesTypes';
import useScheduleSendFeature from '../../composer/actions/scheduleSend/useScheduleSendFeature';
import ExtraAskResign from '../extras/ExtraAskResign';
import ExtraAutoReply from '../extras/ExtraAutoReply';
import ExtraBlockedSender from '../extras/ExtraBlockedSender';
import ExtraDarkStyle from '../extras/ExtraDarkStyle';
import ExtraDecryptedSubject from '../extras/ExtraDecryptedSubject';
import ExtraErrors from '../extras/ExtraErrors';
import ExtraEvents from '../extras/ExtraEvents';
import ExtraExpirationSelfDestruction from '../extras/ExtraExpirationSelfDestruction';
import ExtraExpirationSentExpirationAutoDelete from '../extras/ExtraExpirationSentExpirationAutoDelete';
import ExtraImages from '../extras/ExtraImages';
import ExtraPinKey from '../extras/ExtraPinKey';
import ExtraReadReceipt from '../extras/ExtraReadReceipt';
import ExtraScheduledMessage from '../extras/ExtraScheduledMessage';
import ExtraSpamScore from '../extras/ExtraSpamScore';
import ExtraUnsubscribe from '../extras/ExtraUnsubscribe';
import EmailReminderWidget from '../extras/calendar/EmailReminderWidget';

interface Props {
    message: MessageState;
    sourceMode: boolean;
    onResignContact: () => void;
    messageLoaded: boolean;
    onLoadRemoteImages: () => void;
    onLoadEmbeddedImages: () => void;
}

const HeaderExtra = ({
    message,
    sourceMode,
    messageLoaded,
    onResignContact,
    onLoadRemoteImages,
    onLoadEmbeddedImages,
}: Props) => {
    const [mailSettings] = useMailSettings();
    const received = isReceived(message.data);

    const { canScheduleSend } = useScheduleSendFeature();
    const isScheduledMessage = isScheduled(message.data);
    const showCalendarWidget = messageLoaded && received;

    // TODO: Remove when API has fixed expiresIn and freeze flag issue
    const isFrozen = isFrozenExpiration(message.data) || !!message.draftFlags?.expiresIn;
    const hasExpiration = !!(message.data?.ExpirationTime || message.draftFlags?.expiresIn);
    const isSpamOrTrash = message.data?.LabelIDs?.includes(MAILBOX_LABEL_IDS.TRASH || MAILBOX_LABEL_IDS.SPAM);

    if (!getMessageHasData(message)) {
        return null;
    }

    return (
        <section className="message-header-extra pt-2 hidden-empty">
            <ExtraDecryptedSubject message={message} />
            <ExtraSpamScore message={message} />
            <ExtraErrors message={message} />
            <ExtraAutoReply message={message.data} />
            <ExtraUnsubscribe message={message.data} />
            <ExtraBlockedSender message={message} />
            {message.verification && <ExtraPinKey message={message.data} messageVerification={message.verification} />}
            <ExtraAskResign
                message={message.data}
                messageVerification={message.verification}
                onResignContact={onResignContact}
            />
            {!sourceMode && (
                <ExtraImages
                    messageImages={message.messageImages}
                    type="remote"
                    onLoadImages={onLoadRemoteImages}
                    mailSettings={mailSettings}
                />
            )}

            {showCalendarWidget ? <EmailReminderWidget message={message.data} errors={message.errors} /> : null}
            {showCalendarWidget ? <ExtraEvents message={message} /> : null}
            {isScheduledMessage && canScheduleSend ? <ExtraScheduledMessage message={message} /> : null}
            {hasExpiration && isFrozen ? <ExtraExpirationSentExpirationAutoDelete message={message} /> : null}
            {hasExpiration && !isFrozen && !isSpamOrTrash ? <ExtraExpirationSelfDestruction message={message} /> : null}
            {hasExpiration && !isFrozen && isSpamOrTrash ? (
                <ExtraExpirationSentExpirationAutoDelete message={message} autoDelete />
            ) : null}

            <span className="inline-flex flex-row on-mobile-w100 hidden-empty">
                <ExtraReadReceipt message={message.data} />
                {!sourceMode && (
                    <ExtraImages
                        messageImages={message.messageImages}
                        type="embedded"
                        onLoadImages={onLoadEmbeddedImages}
                        mailSettings={mailSettings}
                    />
                )}

                <ExtraDarkStyle message={message} />
            </span>
        </section>
    );
};

export default HeaderExtra;
