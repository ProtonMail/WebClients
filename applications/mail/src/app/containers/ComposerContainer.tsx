import { ReactNode, memo, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useBeforeUnload, useDrawerWidth } from '@proton/components';
import { pick } from '@proton/shared/lib/helpers/object';

import ComposerFrame from '../components/composer/ComposerFrame';
import { MAX_ACTIVE_COMPOSER_DESKTOP, MAX_ACTIVE_COMPOSER_MOBILE } from '../helpers/composerPositioning';
import { useCompose } from '../hooks/composer/useCompose';
import { EditorTypes } from '../hooks/composer/useComposerContent';
import { useGetMessage } from '../hooks/message/useMessage';
import { useClickMailContent } from '../hooks/useClickMailContent';
import { selectOpenedComposersIds } from '../logic/composers/composerSelectors';
import { composerActions } from '../logic/composers/composersSlice';
import { useAppDispatch, useAppSelector } from '../logic/store';
import { Breakpoints } from '../models/utils';
import { ComposeProvider } from './ComposeProvider';

import '../components/composer/composer.scss';

interface Props {
    breakpoints: Breakpoints;
    children: ReactNode;
}

const useOpenComposer = () => {
    const dispatch = useAppDispatch();
    const getMessage = useGetMessage();

    return (messageID: string) => {
        const message = getMessage(messageID);

        if (!message?.data?.Sender.Address) {
            throw new Error('No address');
        }

        dispatch(
            composerActions.addComposer({
                type: EditorTypes.composer,
                messageID,
                senderEmailAddress: message.data.Sender.Address,
                recipients: pick(message.data, ['ToList', 'CCList', 'BCCList']),
            })
        );
    };
};

const ComposerContainer = ({ breakpoints, children }: Props) => {
    const dispatch = useAppDispatch();
    const composerIDs = useAppSelector(selectOpenedComposersIds);
    const [focusedComposerID, setFocusedComposerID] = useState<string>();
    const drawerOffset = useDrawerWidth();
    const returnFocusToElement = useRef<HTMLElement | null>(null);
    const isComposerOpened = composerIDs.length > 0;

    const openComposerFunc = useOpenComposer();

    useClickMailContent(() => setFocusedComposerID(undefined));

    const maxActiveComposer = breakpoints.isNarrow ? MAX_ACTIVE_COMPOSER_MOBILE : MAX_ACTIVE_COMPOSER_DESKTOP;

    const handleClose = (composerId: string) => () => {
        dispatch(composerActions.removeComposer({ ID: composerId }));
        const remainingComposerIDs = composerIDs.filter((id) => id !== composerId);

        if (remainingComposerIDs.length) {
            setFocusedComposerID(remainingComposerIDs[0]);
        }
    };

    const openComposer = (messageID: string, returnFocusTo?: HTMLElement | null) => {
        openComposerFunc(messageID);

        if (returnFocusTo) {
            returnFocusToElement.current = returnFocusTo;
        }
    };

    const { handleCompose, storageCapacityModal, sendingFromDefaultAddressModal, sendingOriginalMessageModal } =
        useCompose({
            openedComposerIDs: composerIDs,
            openComposer,
            focusComposer: setFocusedComposerID,
            maxActiveComposer,
        });

    const handleFocus = (composerID: string) => () => {
        setFocusedComposerID(composerID);
    };

    // After closing all composers, focus goes back to previously focused element
    useEffect(() => {
        if (composerIDs.length === 0 && returnFocusToElement.current) {
            returnFocusToElement.current.focus();
            returnFocusToElement.current = null;
        }
    }, [composerIDs]);

    useBeforeUnload(
        isComposerOpened
            ? c('Info').t`The data you have entered in the draft may not be saved if you leave the page.`
            : ''
    );

    return (
        <ComposeProvider onCompose={handleCompose}>
            {children}
            <div>
                {composerIDs.map((composerID, i) => (
                    <ComposerFrame
                        key={composerID}
                        index={i}
                        composerID={composerID}
                        count={composerIDs.length}
                        focus={composerID === focusedComposerID}
                        breakpoints={breakpoints}
                        onFocus={handleFocus(composerID)}
                        onClose={handleClose(composerID)}
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
