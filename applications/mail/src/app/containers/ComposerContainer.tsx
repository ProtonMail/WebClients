import { ReactNode, memo, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useBeforeUnload, useDrawerWidth, useHandler } from '@proton/components';

import ComposerFrame from '../components/composer/ComposerFrame';
import { MAX_ACTIVE_COMPOSER_DESKTOP, MAX_ACTIVE_COMPOSER_MOBILE } from '../helpers/composerPositioning';
import { useCompose } from '../hooks/composer/useCompose';
import { useGetMessage } from '../hooks/message/useMessage';
import { useClickMailContent } from '../hooks/useClickMailContent';
import { selectComposerMessageIds, selectComposersCount } from '../logic/composers/composerSelectors';
import { composerActions } from '../logic/composers/composersSlice';
import { useAppDispatch, useAppSelector, useAppStore } from '../logic/store';
import { Breakpoints } from '../models/utils';
import { ComposeProvider } from './ComposeProvider';

import '../components/composer/composer.scss';

interface Props {
    breakpoints: Breakpoints;
    children: ReactNode;
}

const ComposerContainer = ({ breakpoints, children }: Props) => {
    const dispatch = useAppDispatch();
    const composersCount = useAppSelector(selectComposersCount);
    const messageIDs = useAppSelector(selectComposerMessageIds);
    const [focusedMessageID, setFocusedMessageID] = useState<string>();
    const [composerIndex, setComposerIndex] = useState(0);
    const store = useAppStore();
    const getMessage = useGetMessage();
    useClickMailContent(() => setFocusedMessageID(undefined));
    const drawerOffset = useDrawerWidth();

    const returnFocusToElement = useRef<HTMLElement | null>(null);
    const isComposerOpened = composersCount > 0;

    useBeforeUnload(
        isComposerOpened
            ? c('Info').t`The data you have entered in the draft may not be saved if you leave the page.`
            : ''
    );

    const maxActiveComposer = breakpoints.isNarrow ? MAX_ACTIVE_COMPOSER_MOBILE : MAX_ACTIVE_COMPOSER_DESKTOP;

    const handleClose = (messageID: string) => () => {
        dispatch(composerActions.removeComposer({ messageID }));
        const newMessageIDs = messageIDs.filter((id) => id !== messageID);

        if (newMessageIDs.length) {
            setFocusedMessageID(newMessageIDs[0]);
        }
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
        dispatch(composerActions.addComposer({ messageID }));
        setComposerIndex(composerIndex + 1);
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
            {children}
            <div>
                {messageIDs.map((messageID, i) => (
                    <ComposerFrame
                        key={messageID}
                        messageID={messageID}
                        index={i}
                        composerID={composerIndex}
                        count={messageIDs.length}
                        focus={messageID === focusedMessageID}
                        breakpoints={breakpoints}
                        onFocus={handleFocus(messageID)}
                        onClose={handleClose(messageID)}
                        drawerOffset={drawerOffset}
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
