import React, { ReactNode, useState, CSSProperties } from 'react';
import { c } from 'ttag';
import { useMailSettings, useAddresses, useWindowSize, useNotifications, generateUID } from 'react-components';
import { range } from 'proton-shared/lib/helpers/array';

import { MessageExtended } from '../models/message';
import Composer from '../components/composer/Composer';
import { MESSAGE_ACTIONS } from '../constants';
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
    const [mailSettings, loadingSettings] = useMailSettings();
    const [addresses, loadingAddresses] = useAddresses();

    // Handling simple Message would have been simpler
    // But in order to create new drafts from here, MessageExtended was mandatory
    const [messages, setMessages] = useState<MessageExtended[]>([]);
    const [focusedMessage, setFocusedMessage] = useState<MessageExtended | undefined>();
    const [width, height] = useWindowSize();
    const { createNotification } = useNotifications();
    const createDraft = useDraft();

    if (loadingSettings || loadingAddresses) {
        return null;
    }

    const handleCompose = (composeArgs: ComposeArgs) => {
        if (messages.length >= 3) {
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

            const existingMessage = messages.find((m) => m.data?.ID === existingDraft.data?.ID);
            if (existingMessage) {
                setFocusedMessage(existingMessage);
                return;
            }

            setMessages([...messages, existingDraft]);
            existingDraft.localID = existingDraft.data?.ID;
            setFocusedMessage(existingDraft);
            return;
        }

        if (composeNew) {
            const { action, referenceMessage } = composeNew;
            const newMessage = createDraft(action, referenceMessage);
            newMessage.localID = generateUID('draft');
            setMessages([...messages, newMessage]);
            setFocusedMessage(newMessage);
        }
    };
    const handleChange = (oldMessage: MessageExtended) => (newMessage: MessageExtended) => {
        const newMessages = [...messages];
        newMessage.localID = oldMessage.localID;
        newMessages[newMessages.indexOf(oldMessage)] = newMessage;
        setMessages(newMessages);
        if (oldMessage === focusedMessage) {
            setFocusedMessage(newMessage);
        }
    };
    const handleClose = (message: MessageExtended) => () => {
        const newMessages = messages.filter((m) => m !== message);
        setMessages(newMessages);
        if (newMessages.length > 0) {
            setFocusedMessage(newMessages[0]);
        }
    };
    const handleFocus = (message: MessageExtended) => () => {
        setFocusedMessage(message);
    };

    const rightPositions = computeRightPositions(messages.length, width);

    return (
        <>
            {children({ onCompose: handleCompose })}
            <div className="composer-container">
                {messages.map((message, i) => (
                    <Composer
                        key={message.localID}
                        style={computeStyle(i, message === focusedMessage, rightPositions, height)}
                        message={message}
                        focus={message === focusedMessage}
                        mailSettings={mailSettings}
                        addresses={addresses}
                        onFocus={handleFocus(message)}
                        onChange={handleChange(message)}
                        onClose={handleClose(message)}
                    />
                ))}
            </div>
        </>
    );
};

export default ComposerContainer;
