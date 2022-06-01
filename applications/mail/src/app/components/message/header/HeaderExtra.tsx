import { isReceived, isScheduled } from '@proton/shared/lib/mail/messages';
import { FeatureCode, useFeature, useMailSettings } from '@proton/components';
import ExtraImages from '../extras/ExtraImages';
import ExtraUnsubscribe from '../extras/ExtraUnsubscribe';
import ExtraSpamScore from '../extras/ExtraSpamScore';
import ExtraReadReceipt from '../extras/ExtraReadReceipt';
import ExtraAutoReply from '../extras/ExtraAutoReply';
import ExtraExpirationTime from '../extras/ExtraExpirationTime';
import ExtraEvents from '../extras/ExtraEvents';
import ExtraPinKey from '../extras/ExtraPinKey';
import ExtraAskResign from '../extras/ExtraAskResign';
import ExtraErrors from '../extras/ExtraErrors';
import ExtraDecryptedSubject from '../extras/ExtraDecryptedSubject';
import ExtraScheduledMessage from '../extras/ExtraScheduledMessage';
import EmailReminderWidget from '../extras/calendar/EmailReminderWidget';
import ExtraDarkStyle from '../extras/ExtraDarkStyle';
import { MessageState, MessageStateWithData } from '../../../logic/messages/messagesTypes';

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

            {messageLoaded && received && <EmailReminderWidget message={message.data} errors={message.errors} />}
            {messageLoaded && received ? <ExtraEvents message={message as MessageStateWithData} /> : null}
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
