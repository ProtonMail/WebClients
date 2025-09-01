import React from 'react';

import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { isExpiringByRetentionRule, isFrozenExpiration } from '@proton/shared/lib/mail/messages';
import { useFlag } from '@proton/unleash';

import { getMessageHasData } from 'proton-mail/helpers/message/messages';

import ExtraExpirationSelfDestruction from './ExtraExpirationSelfDestruction';
import ExtraExpirationSentExpirationAutoDelete from './ExtraExpirationSentExpirationAutoDelete';

interface Props {
    message: MessageState;
}

const ExtraExpiration = ({ message }: Props) => {
    const dataRetentionPolicyEnabled = useFlag('DataRetentionPolicy');

    if (!getMessageHasData(message)) {
        return null;
    }

    // TODO: Remove when API has fixed expiresIn and freeze flag issue (MAILBE-1129)
    const isFrozen = isFrozenExpiration(message.data) || !!message.draftFlags?.expiresIn;
    const hasExpiration = !!(message.data?.ExpirationTime || message.draftFlags?.expiresIn);
    const hasSpamOrTrash =
        message.data?.LabelIDs?.includes(MAILBOX_LABEL_IDS.TRASH) ||
        message.data?.LabelIDs?.includes(MAILBOX_LABEL_IDS.SPAM);

    if (dataRetentionPolicyEnabled && isExpiringByRetentionRule(message.data)) {
        return null;
    }

    return (
        <>
            {hasExpiration && isFrozen ? <ExtraExpirationSentExpirationAutoDelete message={message} /> : null}
            {hasExpiration && !isFrozen && !hasSpamOrTrash ? (
                <ExtraExpirationSelfDestruction message={message} />
            ) : null}
            {hasExpiration && !isFrozen && hasSpamOrTrash ? (
                <ExtraExpirationSentExpirationAutoDelete message={message} autoDelete />
            ) : null}
        </>
    );
};

export default ExtraExpiration;
