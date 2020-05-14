import React, { ReactNode, useState, useEffect } from 'react';
import { c } from 'ttag';
import { useAddresses, useWindowSize, useNotifications } from 'react-components';

import Composer from '../components/composer/Composer';
import { MESSAGE_ACTIONS } from '../constants';
import { MessageExtended, PartialMessageExtended } from '../models/message';
import { useDraft } from '../hooks/useDraft';
import { useMessageCache } from './MessageProvider';
import { useHandler } from '../hooks/useHandler';
import { Breakpoints, WindowSize } from '../models/utils';
import { MAX_ACTIVE_COMPOSER_MOBILE, MAX_ACTIVE_COMPOSER_DESKTOP } from '../helpers/composerPositioning';

import '../components/composer/composer.scss';

export interface ComposeExisting {
    existingDraft: MessageExtended;
}

export interface ComposeNew {
    action: MESSAGE_ACTIONS;
    referenceMessage?: PartialMessageExtended;
}

export type ComposeArgs = ComposeExisting | ComposeNew;

export const getComposeExisting = (composeArgs: ComposeArgs) =>
    (composeArgs as ComposeExisting).existingDraft ? (composeArgs as ComposeExisting) : undefined;

export const getComposeNew = (composeArgs: ComposeArgs) =>
    typeof (composeArgs as ComposeNew).action === 'number' ? (composeArgs as ComposeNew) : undefined;

export const getComposeArgs = (composeArgs: ComposeArgs) => ({
    composeExisting: getComposeExisting(composeArgs),
    composeNew: getComposeNew(composeArgs)
});

export interface OnCompose {
    (args: ComposeArgs): void;
}

interface Props {
    breakpoints: Breakpoints;
    children: (props: { onCompose: OnCompose }) => ReactNode;
}

const ComposerContainer = ({ breakpoints, children }: Props) => {
    const [addresses, loadingAddresses] = useAddresses();

    const [messageIDs, setMessageIDs] = useState<string[]>([]);
    const [focusedMessageID, setFocusedMessageID] = useState<string>();
    const [width, height] = useWindowSize();
    const windowSize: WindowSize = { width, height };
    const { createNotification } = useNotifications();
    const createDraft = useDraft();
    const messageCache = useMessageCache();

    const maxActiveComposer = breakpoints.isNarrow ? MAX_ACTIVE_COMPOSER_MOBILE : MAX_ACTIVE_COMPOSER_DESKTOP;

    const handleClose = (messageID: string) => () => {
        const newMessageIDs = messageIDs.filter((id) => id !== messageID);
        setMessageIDs(newMessageIDs);
        if (newMessageIDs.length > 0) {
            setFocusedMessageID(newMessageIDs[0]);
        }
    };

    // Automatically close draft which has been deleted (could happen through the message list)
    const messageDeletionListener = useHandler((changedMessageID: string) => {
        if (messageIDs.includes(changedMessageID) && !messageCache.has(changedMessageID)) {
            handleClose(changedMessageID)();
        }
    });

    useEffect(() => messageCache.subscribe(messageDeletionListener), [messageCache]);

    if (loadingAddresses) {
        return null;
    }

    const handleCompose = (composeArgs: ComposeArgs) => {
        if (messageIDs.length >= maxActiveComposer) {
            createNotification({
                type: 'error',
                text: c('Error').t`Maximum composer reached`
            });
            return;
        }

        const { composeExisting, composeNew } = getComposeArgs(composeArgs);

        if (composeExisting) {
            const { existingDraft } = composeExisting;

            const existingMessageID = messageIDs.find((id) => id === existingDraft.localID);
            if (existingMessageID) {
                setFocusedMessageID(existingMessageID);
                return;
            }

            setMessageIDs([...messageIDs, existingDraft.localID]);
            setFocusedMessageID(existingDraft.localID);
            return;
        }

        if (composeNew) {
            const { action, referenceMessage } = composeNew;
            const newMessageID = createDraft(action, referenceMessage);
            setMessageIDs([...messageIDs, newMessageID]);
            setFocusedMessageID(newMessageID);
        }
    };

    const handleFocus = (messageID: string) => () => {
        setFocusedMessageID(messageID);
    };

    return (
        <>
            {children({ onCompose: handleCompose })}
            <div className="composer-container">
                {messageIDs.map((messageID, i) => (
                    <Composer
                        key={messageID}
                        messageID={messageID}
                        index={i}
                        count={messageIDs.length}
                        focus={messageID === focusedMessageID}
                        addresses={addresses}
                        windowSize={windowSize}
                        breakpoints={breakpoints}
                        onFocus={handleFocus(messageID)}
                        onClose={handleClose(messageID)}
                    />
                ))}
            </div>
        </>
    );
};

export default ComposerContainer;
