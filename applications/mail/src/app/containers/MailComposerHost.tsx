import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { useHistory } from 'react-router';

import { useHandler } from '@proton/hooks/useHandler';
import { ComposerMessageHostProvider } from '@proton/mail-composer/host/composerMessageHost';
import type { MessageWithOptionalBody } from '@proton/mail-message/store/messages/messagesTypes';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { getParamsFromPathname, setParamsInLocation } from '../helpers/mailboxUrl';
import { MOVE_BACK_ACTION_TYPES } from '../hooks/actions/moveBackAction/interfaces';
import { useMoveBackAction } from '../hooks/actions/moveBackAction/useMoveBackAction';
import type { ComposerHost } from '../hooks/composer/useComposerHost';
import { ComposerHostProvider } from '../hooks/composer/useComposerHost';
import { useMailboxCounter } from '../hooks/mailboxCounter/useMailboxCounter';
import { mailComposerMessageHost } from './mailComposerMessageHost';

interface Props {
    children: ReactNode;
}

export const MailComposerHost = ({ children }: Props) => {
    const history = useHistory<any>();
    const { getLocationCount, loading } = useMailboxCounter();
    const moveBack = useMoveBackAction();

    const scheduledCount = getLocationCount(MAILBOX_LABEL_IDS.SCHEDULED).Total;

    const onMessageSent = useHandler((sent: Message) => {
        const {
            params: { labelID, elementID },
        } = getParamsFromPathname(history.location.pathname);

        if (elementID === sent.ConversationID) {
            history.push(
                setParamsInLocation(history.location, {
                    labelID,
                    elementID: sent.ConversationID,
                    messageID: sent.ID,
                })
            );
        }
    });

    const onDraftDiscarded = useHandler((draft: MessageWithOptionalBody) => {
        moveBack({ type: MOVE_BACK_ACTION_TYPES.PERMANENT_DELETE, elements: [draft] });
    });

    const host = useMemo<ComposerHost>(
        () => ({ scheduledCount, scheduledCountLoading: loading, onMessageSent, onDraftDiscarded }),
        [scheduledCount, loading, onMessageSent, onDraftDiscarded]
    );

    return (
        <ComposerMessageHostProvider host={mailComposerMessageHost}>
            <ComposerHostProvider value={host}>{children}</ComposerHostProvider>
        </ComposerMessageHostProvider>
    );
};
