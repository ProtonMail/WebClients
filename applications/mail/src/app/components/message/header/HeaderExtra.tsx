import { isReceived, isScheduled } from '@proton/shared/lib/mail/messages';
import { FeatureCode, useFeature } from '@proton/components';
import ExtraImages from '../extras/ExtraImages';
import ExtraUnsubscribe from '../extras/ExtraUnsubscribe';
import ExtraSpamScore from '../extras/ExtraSpamScore';
import ExtraReadReceipt from '../extras/ExtraReadReceipt';
import ExtraAutoReply from '../extras/ExtraAutoReply';
import ExtraExpirationTime from '../extras/ExtraExpirationTime';
import ExtraEvents from '../extras/ExtraEvents';
import ExtraPinKey from '../extras/ExtraPinKey';
import ExtraAskResign from '../extras/ExtraAskResign';
import { MessageExtended } from '../../../models/message';
import ExtraErrors from '../extras/ExtraErrors';
import ExtraDecryptedSubject from '../extras/ExtraDecryptedSubject';
import ExtraScheduledMessage from '../extras/ExtraScheduledMessage';

interface Props {
    message: MessageExtended;
    sourceMode: boolean;
    onResignContact: () => void;
    messageLoaded: boolean;
    bodyLoaded: boolean;
    onLoadRemoteImages: () => void;
    onLoadEmbeddedImages: () => void;
}

const HeaderExtra = ({
    message,
    sourceMode,
    messageLoaded,
    bodyLoaded,
    onResignContact,
    onLoadRemoteImages,
    onLoadEmbeddedImages,
}: Props) => {
    const received = message.data && isReceived(message.data);

    const { feature: scheduledFeature } = useFeature(FeatureCode.ScheduledSend);
    const isScheduledMessage = isScheduled(message.data);

    return (
        <section className="message-header-extra border-top pt0-5">
            <ExtraExpirationTime message={message} />
            <ExtraDecryptedSubject message={message} />
            <ExtraSpamScore message={message} />
            {bodyLoaded && <ExtraErrors message={message} />}
            <ExtraUnsubscribe message={message} />
            <ExtraReadReceipt message={message} />
            <ExtraAutoReply message={message} />
            {messageLoaded && <ExtraPinKey message={message.data} messageVerification={message.verification} />}
            <ExtraAskResign
                message={message.data}
                messageVerification={message.verification}
                onResignContact={onResignContact}
            />
            {!sourceMode && <ExtraImages message={message} type="remote" onLoadImages={onLoadRemoteImages} />}
            {!sourceMode && <ExtraImages message={message} type="embedded" onLoadImages={onLoadEmbeddedImages} />}
            {messageLoaded && received ? <ExtraEvents message={message} /> : null}
            {isScheduledMessage && scheduledFeature?.Value ? <ExtraScheduledMessage message={message} /> : null}
        </section>
    );
};

export default HeaderExtra;
