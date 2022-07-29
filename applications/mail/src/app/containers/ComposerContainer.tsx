import { ReactNode, memo, useEffect, useRef, useState } from 'react';
import { useStore } from 'react-redux';

import { c } from 'ttag';

import { useBeforeUnload, useHandler, useWindowSize } from '@proton/components';

import ComposerFrame from '../components/composer/ComposerFrame';
import { MAX_ACTIVE_COMPOSER_DESKTOP, MAX_ACTIVE_COMPOSER_MOBILE } from '../helpers/composerPositioning';
import { useCompose } from '../hooks/composer/useCompose';
import { useGetMessage } from '../hooks/message/useMessage';
import { useClickMailContent } from '../hooks/useClickMailContent';
import { Breakpoints, WindowSize } from '../models/utils';
import { ComposeProvider } from './ComposeProvider';

import '../components/composer/composer.scss';

interface Props {
    breakpoints: Breakpoints;
    children: (props: { isComposerOpened: boolean }) => ReactNode;
}

const ComposerContainer = ({ breakpoints, children }: Props) => {
    const [messageIDs, setMessageIDs] = useState<string[]>([]);
    const [focusedMessageID, setFocusedMessageID] = useState<string>();
    const [width, height] = useWindowSize();
    const windowSize: WindowSize = { width, height };
    const store = useStore();
    const getMessage = useGetMessage();
    useClickMailContent(() => setFocusedMessageID(undefined));

    const returnFocusToElement = useRef<HTMLElement | null>(null);

    useBeforeUnload(
        messageIDs.length
            ? c('Info').t`The data you have entered in the draft may not be saved if you leave the page.`
            : ''
    );

    const isComposerOpened = !!messageIDs.length;

    const maxActiveComposer = breakpoints.isNarrow ? MAX_ACTIVE_COMPOSER_MOBILE : MAX_ACTIVE_COMPOSER_DESKTOP;

    const handleClose = (messageID: string) => () => {
        return setMessageIDs((messageIDs) => {
            const newMessageIDs = messageIDs.filter((id) => id !== messageID);

            if (newMessageIDs.length) {
                setFocusedMessageID(newMessageIDs[0]);
            }

            return newMessageIDs;
        });
    };

    const messageDeletionListener = useHandler(() => {
        messageIDs.forEach((messageID) => {
            const message = getMessage(messageID);
            if (!message) {
                handleClose(messageID)();
            }
        });
    });

    // Automatically close draft which has been deleted (could happen through the message list)
    // Doesnt use a useSelector to avoir render on a child component update
    useEffect(() => store.subscribe(messageDeletionListener), [store]);

    // After closing all composers, focus goes back to previously focused element
    useEffect(() => {
        if (messageIDs.length === 0 && returnFocusToElement.current) {
            returnFocusToElement.current.focus();
            returnFocusToElement.current = null;
        }
    }, [messageIDs]);

    const openComposer = (messageID: string, returnFocusTo?: HTMLElement | null) => {
        setMessageIDs((messageIDs) => [...messageIDs, messageID]);
        if (returnFocusTo) {
            returnFocusToElement.current = returnFocusTo;
        }
    };

    const { handleCompose, storageCapacityModal, sendingFromDefaultAddressModal, sendingOriginalMessageModal } =
        useCompose(messageIDs, openComposer, setFocusedMessageID, maxActiveComposer);

    const handleFocus = (messageID: string) => () => {
        setFocusedMessageID(messageID);
    };

    return (
        <ComposeProvider onCompose={handleCompose}>
            {children({ isComposerOpened })}
            <div className="composer-container">
                {messageIDs.map((messageID, i) => (
                    <ComposerFrame
                        key={messageID}
                        messageID={messageID}
                        index={i}
                        count={messageIDs.length}
                        focus={messageID === focusedMessageID}
                        windowSize={windowSize}
                        breakpoints={breakpoints}
                        onFocus={handleFocus(messageID)}
                        onClose={handleClose(messageID)}
                    />
                ))}
            </div>
            {sendingFromDefaultAddressModal}
            {sendingOriginalMessageModal}
            {storageCapacityModal}
        </ComposeProvider>
    );
};

export default memo(ComposerContainer);
