import { FeatureCode, useFeature, useMailSettings } from '@proton/components';
import { isReceived, isScheduled } from '@proton/shared/lib/mail/messages';

import { getMessageHasData } from '../../../helpers/message/messages';
import { MessageState } from '../../../logic/messages/messagesTypes';
import ExtraAskResign from '../extras/ExtraAskResign';
import ExtraAutoReply from '../extras/ExtraAutoReply';
import ExtraDarkStyle from '../extras/ExtraDarkStyle';
import ExtraDecryptedSubject from '../extras/ExtraDecryptedSubject';
import ExtraErrors from '../extras/ExtraErrors';
import ExtraEvents from '../extras/ExtraEvents';
import ExtraExpirationTime from '../extras/ExtraExpirationTime';
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

    const { feature: scheduledFeature } = useFeature(FeatureCode.ScheduledSend);
    const isScheduledMessage = isScheduled(message.data);

    return (
        <section className="message-header-extra pt0-5 hidden-empty">
            <ExtraDecryptedSubject message={message} />
            <ExtraSpamScore message={message} />
            <ExtraErrors message={message} />
            <ExtraAutoReply message={message} />
            <ExtraUnsubscribe message={message} />
            {message.data && message.verification && (
                <ExtraPinKey message={message.data} messageVerification={message.verification} />
            )}
            <ExtraAskResign
                message={message.data}
                messageVerification={message.verification}
                onResignContact={onResignContact}
            />
            {!sourceMode && (
                <ExtraImages
                    message={message}
                    type="remote"
                    onLoadImages={onLoadRemoteImages}
                    mailSettings={mailSettings}
                />
            )}

            {messageLoaded && received && getMessageHasData(message) && (
                <EmailReminderWidget message={message.data} errors={message.errors} />
            )}
            {messageLoaded && received && getMessageHasData(message) ? <ExtraEvents message={message} /> : null}
            {isScheduledMessage && scheduledFeature?.Value ? <ExtraScheduledMessage message={message} /> : null}

            <span className="inline-flex flex-row on-mobile-w100 hidden-empty">
                <ExtraExpirationTime displayAsButton message={message} />
                <ExtraReadReceipt message={message} />
                {!sourceMode && (
                    <ExtraImages
                        message={message}
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
