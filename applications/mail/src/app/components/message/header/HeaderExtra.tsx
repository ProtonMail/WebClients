import { OpenPGPKey } from 'pmcrypto';
import { FEATURE_FLAGS } from 'proton-shared/lib/constants';
import React from 'react';
import { isReceived } from '../../../helpers/message/messages';
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

interface Props {
    message: MessageExtended;
    sourceMode: boolean;
    onTrustSigningKey: (key: OpenPGPKey) => void;
    onTrustAttachedKey: (key: OpenPGPKey) => void;
    onResignContact: () => void;
    messageLoaded: boolean;
    onLoadRemoteImages: () => void;
    onLoadEmbeddedImages: () => void;
}

const HeaderExtra = ({
    message,
    sourceMode,
    messageLoaded,
    onTrustSigningKey,
    onTrustAttachedKey,
    onResignContact,
    onLoadRemoteImages,
    onLoadEmbeddedImages
}: Props) => {
    const received = isReceived(message.data);
    const showWidget = FEATURE_FLAGS.includes('calendar-invitations');
    return (
        <section className="message-header-extra mt0-5 border-top pt0-5">
            <ExtraExpirationTime message={message} />
            <ExtraDecryptedSubject message={message} />
            <ExtraSpamScore message={message} />
            <ExtraErrors message={message} />
            <ExtraUnsubscribe message={message} />
            <ExtraReadReceipt message={message} />
            <ExtraAutoReply message={message} />
            <ExtraPinKey
                message={message}
                onTrustSigningKey={onTrustSigningKey}
                onTrustAttachedKey={onTrustAttachedKey}
            />
            <ExtraAskResign message={message} onResignContact={onResignContact} />
            {!sourceMode && <ExtraImages message={message} type="remote" onLoadImages={onLoadRemoteImages} />}
            {!sourceMode && <ExtraImages message={message} type="embedded" onLoadImages={onLoadEmbeddedImages} />}
            {messageLoaded && received && showWidget ? <ExtraEvents message={message} /> : null}
        </section>
    );
};

export default HeaderExtra;
