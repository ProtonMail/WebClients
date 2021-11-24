import { ReactNode, useState, useEffect, memo, useRef } from 'react';
import { useWindowSize, useHandler, useBeforeUnload } from '@proton/components';
import { c } from 'ttag';
import { Breakpoints, WindowSize } from '../models/utils';
import { MAX_ACTIVE_COMPOSER_MOBILE, MAX_ACTIVE_COMPOSER_DESKTOP } from '../helpers/composerPositioning';
import { useCompose } from '../hooks/composer/useCompose';
import ComposerFrame from '../components/composer/ComposerFrame';
import '../components/composer/composer.scss';
import { useClickMailContent } from '../hooks/useClickMailContent';
import { ComposeProvider } from './ComposeProvider';

interface Props {
    breakpoints: Breakpoints;
    children: (props: { isComposerOpened: boolean }) => ReactNode;
}

const ComposerContainer = ({ breakpoints, children }: Props) => {
    const [messageIDs, setMessageIDs] = useState<string[]>([]);
    const [focusedMessageID, setFocusedMessageID] = useState<string>();
    const [width, height] = useWindowSize();
    const windowSize: WindowSize = { width, height };
    // const messageCache = useMessageCache();
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

    // Automatically close draft which has been deleted (could happen through the message list)
    const messageDeletionListener = useHandler((changedMessageID: string) => {
        if (messageIDs.includes(changedMessageID) && !messageCache.has(changedMessageID)) {
            handleClose(changedMessageID)();
        }
    });

    // After closing all composers, focus goes back to previously focused element
    useEffect(() => {
        if (messageIDs.length === 0 && returnFocusToElement.current) {
            returnFocusToElement.current.focus();
            returnFocusToElement.current = null;
        }
    }, [messageIDs]);

    // TODO
    // useEffect(() => messageCache.subscribe(messageDeletionListener), [messageCache]);

    const openComposer = (messageID: string, returnFocusTo?: HTMLElement | null) => {
        setMessageIDs((messageIDs) => [...messageIDs, messageID]);
        if (returnFocusTo) {
            returnFocusToElement.current = returnFocusTo;
        }
    };

    const handleCompose = useCompose(messageIDs, openComposer, setFocusedMessageID, maxActiveComposer);

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
        </ComposeProvider>
    );
};

export default memo(ComposerContainer);
