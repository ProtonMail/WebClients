import { OpenPGPKey } from 'pmcrypto';
import { isReceived } from 'proton-shared/lib/mail/messages';
import React from 'react';
import ExtraImages from '../extras/ExtraImages';
import ExtraUnsubscribe from '../extras/ExtraUnsubscribe';
import ExtraSpamScore from '../extras/ExtraSpamScore';
import ExtraReadReceipt from '../extras/ExtraReadReceipt';
import ExtraAutoReply from '../extras/ExtraAutoReply';
import ExtraExpirationTime from '../extras/ExtraExpirationTime';
import ExtraEvents from '../extras/ExtraEvents';
import ExtraPinKey from '../extras/ExtraPinKey';
import ExtraAskResign from '../extras/ExtraAskResign';
import { MessageExtended, MessageExtendedWithData } from '../../../models/message';
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
    labelID: string;
}

const HeaderExtra = ({
    labelID,
    message,
    sourceMode,
    messageLoaded,
    onTrustSigningKey,
    onTrustAttachedKey,
    onResignContact,
    onLoadRemoteImages,
    onLoadEmbeddedImages,
}: Props) => {
    const received = message.data && isReceived(message.data);
    return (
        <section className="message-header-extra border-top pt0-5">
            <ExtraExpirationTime message={message} />
            <ExtraDecryptedSubject message={message} />
            <ExtraSpamScore message={message} labelID={labelID} />
            <ExtraErrors message={message} />
            <ExtraUnsubscribe message={message} />
            <ExtraReadReceipt message={message} />
            <ExtraAutoReply message={message} />
            {messageLoaded && (
                <ExtraPinKey
                    message={message}
                    onTrustSigningKey={onTrustSigningKey}
                    onTrustAttachedKey={onTrustAttachedKey}
                />
            )}
            <ExtraAskResign message={message} onResignContact={onResignContact} />
            {!sourceMode && <ExtraImages message={message} type="remote" onLoadImages={onLoadRemoteImages} />}
            {!sourceMode && <ExtraImages message={message} type="embedded" onLoadImages={onLoadEmbeddedImages} />}
            {messageLoaded && received ? <ExtraEvents message={message as MessageExtendedWithData} /> : null}
        </section>
    );
};

export default HeaderExtra;
