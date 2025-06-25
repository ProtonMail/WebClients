import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { isReceived, isScheduled, isSnoozed } from '@proton/shared/lib/mail/messages';

import ExtraPassNudge from 'proton-mail/components/message/extrasHeader/components/ExtraPassNudge';

import { getMessageHasData } from '../../../helpers/message/messages';
import useMailModel from '../../../hooks/useMailModel';
import useScheduleSendFeature from '../../composer/actions/scheduleSend/useScheduleSendFeature';
import ExtraAskResign from './components/ExtraAskResign';
import ExtraAutoReply from './components/ExtraAutoReply';
import ExtraBlockedSender from './components/ExtraBlockedSender';
import ExtraDarkStyle from './components/ExtraDarkStyle';
import ExtraDecryptedSubject from './components/ExtraDecryptedSubject';
import ExtraErrors from './components/ExtraErrors';
import ExtraEvents from './components/ExtraEvents';
import ExtraImages from './components/ExtraImages';
import ExtraPinKey from './components/ExtraPinKey';
import ExtraReadReceipt from './components/ExtraReadReceipt';
import ExtraScheduledMessage from './components/ExtraScheduledMessage';
import ExtraSnoozedMessage from './components/ExtraSnoozedMessage';
import ExtraSpamScore from './components/ExtraSpamScore';
import ExtraUnsubscribe from './components/ExtraUnsubscribe';
import EmailReminderWidget from './components/calendar/EmailReminderWidget';
import ExtraExpiration from './components/expiration/ExtraExpiration';

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
    const mailSettings = useMailModel('MailSettings');
    const received = isReceived(message.data);

    const { canScheduleSend } = useScheduleSendFeature();
    const isScheduledMessage = isScheduled(message.data);
    const isSnoozeMessage = isSnoozed(message.data);
    const showCalendarWidget = messageLoaded && received;

    if (!getMessageHasData(message)) {
        return null;
    }

    return (
        <section className="message-header-extra flex flex-column flex-nowrap py-2 gap-1 empty:hidden">
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
            {isSnoozeMessage ? <ExtraSnoozedMessage message={message} /> : null}
            <ExtraExpiration message={message} />
            <ExtraPassNudge messageSubject={message.data.Subject} />

            <span className="inline-flex flex-row w-full md:w-auto empty:hidden">
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
