import React, { ReactNode, useState, CSSProperties } from 'react';
import { c } from 'ttag';
import { useAddresses, useWindowSize, useNotifications } from 'react-components';
import { range } from 'proton-shared/lib/helpers/array';

import Composer from '../components/composer/Composer';
import { MESSAGE_ACTIONS } from '../constants';
import { MessageExtended } from '../models/message';
import { useDraft } from '../hooks/useDraft';

import '../components/composer/composer.scss';

export const COMPOSER_WIDTH = 600;
export const COMPOSER_HEIGHT = 520;
export const COMPOSER_GUTTER = 20;
export const COMPOSER_VERTICAL_GUTTER = 10;
export const COMPOSER_ZINDEX = 300;
export const COMPOSER_SWITCH_MODE = 20;
export const HEADER_HEIGHT = 80;
export const APP_BAR_WIDTH = 45;

const computeRightPositions = (count: number, width: number): number[] => {
    const neededWidth = COMPOSER_WIDTH * count + COMPOSER_GUTTER * (count + 1);

    if (neededWidth < width) {
        return range(0, count).map((i) => COMPOSER_WIDTH * i + COMPOSER_GUTTER * (i + 1));
    }

    const widthToDivide = width - COMPOSER_GUTTER * 2 - COMPOSER_WIDTH;
    const share = widthToDivide / (count - 1);
    return range(0, count).map((i) => COMPOSER_GUTTER + share * i);
};

const computeStyle = (index: number, hasFocus: boolean, rightPositions: number[], height: number): CSSProperties => {
    const maxHeight = height - COMPOSER_VERTICAL_GUTTER - HEADER_HEIGHT;
    return {
        right: rightPositions[index],
        zIndex: hasFocus ? COMPOSER_ZINDEX + 1 : COMPOSER_ZINDEX,
        height: maxHeight > COMPOSER_HEIGHT ? COMPOSER_HEIGHT : maxHeight
    };
};

export interface ComposeExisting {
    existingDraft: MessageExtended;
}

export interface ComposeNew {
    action: MESSAGE_ACTIONS;
    referenceMessage?: MessageExtended;
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
    children: (props: { onCompose: OnCompose }) => ReactNode;
}

const ComposerContainer = ({ children }: Props) => {
    const [addresses, loadingAddresses] = useAddresses();

    // Handling simple Message would have been simpler
    // But in order to create new drafts from here, MessageExtended was mandatory
    const [messageIDs, setMessageIDs] = useState<string[]>([]);
    const [focusedMessageID, setFocusedMessageID] = useState<string | undefined>();
    const [width, height] = useWindowSize();
    const { createNotification } = useNotifications();
    const createDraft = useDraft();

    if (loadingAddresses) {
        return null;
    }

    const handleCompose = (composeArgs: ComposeArgs) => {
        if (messageIDs.length >= 3) {
            createNotification({
                type: 'error',
                text: c('Error').t`Maximum composer reached`
            });
            return;
        }

        const { composeExisting, composeNew } = getComposeArgs(composeArgs);

        // console.log('compose', composeExisting, composeNew);

        if (composeExisting) {
            const { existingDraft } = composeExisting;

            const existingMessageID = messageIDs.find((id) => id === existingDraft.localID);
            if (existingMessageID) {
                setFocusedMessageID(existingMessageID);
                return;
            }

            setMessageIDs([...messageIDs, existingDraft.localID]);
            // existingDraft.localID = existingDraft.data?.ID;
            setFocusedMessageID(existingDraft.localID);
            return;
        }

        if (composeNew) {
            const { action, referenceMessage } = composeNew;
            const newMessageID = createDraft(action, referenceMessage);
            // newMessage.localID = generateUID('draft');
            setMessageIDs([...messageIDs, newMessageID]);
            setFocusedMessageID(newMessageID);
        }
    };
    // const handleChange = (oldMessage: MessageExtended) => (newMessage: MessageExtended) => {
    //     const newMessages = [...messages];
    //     newMessages[newMessages.indexOf(oldMessage)] = newMessage;
    //     setMessages(newMessages);
    //     if (oldMessage === focusedMessage) {
    //         setFocusedMessage(newMessage);
    //     }
    // };
    const handleClose = (messageID: string) => () => {
        const newMessageIDs = messageIDs.filter((id) => id !== messageID);
        setMessageIDs(newMessageIDs);
        if (newMessageIDs.length > 0) {
            setFocusedMessageID(newMessageIDs[0]);
        }
    };
    const handleFocus = (messageID: string) => () => {
        setFocusedMessageID(messageID);
    };

    const rightPositions = computeRightPositions(messageIDs.length, width);

    return (
        <>
            {children({ onCompose: handleCompose })}
            <div className="composer-container">
                {messageIDs.map((messageID, i) => (
                    <Composer
                        key={messageID}
                        style={computeStyle(i, messageID === focusedMessageID, rightPositions, height)}
                        messageID={messageID}
                        focus={messageID === focusedMessageID}
                        addresses={addresses}
                        onFocus={handleFocus(messageID)}
                        onClose={handleClose(messageID)}
                    />
                ))}
            </div>
        </>
    );
};

export default ComposerContainer;
