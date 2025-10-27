import type { ReactNode } from 'react';
import { memo, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useActiveBreakpoint, useBeforeUnload, useDrawerWidth } from '@proton/components';

import { ComposerAssistantProvider } from 'proton-mail/components/assistant/provider/ComposerAssistantProvider';
import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';

import ComposerFrame from '../components/composer/ComposerFrame';
import { MAX_ACTIVE_COMPOSER_LARGE_SCREEN, MAX_ACTIVE_COMPOSER_SMALL_SCREEN } from '../helpers/composerPositioning';
import { useCompose } from '../hooks/composer/useCompose';
import { useClickMailContent } from '../hooks/useClickMailContent';
import { selectOpenedComposersIds } from '../store/composers/composerSelectors';
import { composerActions } from '../store/composers/composersSlice';
import { ComposeProvider } from './ComposeProvider';

import '../components/composer/composer.scss';

interface Props {
    children: ReactNode;
}

const ComposerContainer = ({ children }: Props) => {
    const dispatch = useMailDispatch();
    const composerIDs = useMailSelector(selectOpenedComposersIds);
    const [focusedComposerID, setFocusedComposerID] = useState<string>();
    const drawerOffset = useDrawerWidth();
    const returnFocusToElementRef = useRef<HTMLElement | null>(null);
    const isComposerOpened = composerIDs.length > 0;
    const breakpoints = useActiveBreakpoint();

    useClickMailContent(() => setFocusedComposerID(undefined));

    const maxActiveComposer = breakpoints.viewportWidth['<=small']
        ? MAX_ACTIVE_COMPOSER_SMALL_SCREEN
        : MAX_ACTIVE_COMPOSER_LARGE_SCREEN;

    const handleClose = (composerId: string) => () => {
        dispatch(composerActions.removeComposer({ ID: composerId }));
        const remainingComposerIDs = composerIDs.filter((id) => id !== composerId);

        if (remainingComposerIDs.length) {
            setFocusedComposerID(remainingComposerIDs[0]);
        }
    };

    const { handleCompose, storageCapacityModal, sendingFromDefaultAddressModal, sendingOriginalMessageModal } =
        useCompose({
            focusComposer: setFocusedComposerID,
            maxActiveComposer,
            openedComposerIDs: composerIDs,
            returnFocusToElementRef,
        });

    const handleFocus = (composerID: string) => () => {
        setFocusedComposerID(composerID);
    };

    // After closing all composers, focus goes back to previously focused element
    useEffect(() => {
        if (composerIDs.length === 0 && returnFocusToElementRef.current) {
            returnFocusToElementRef.current.focus();
            returnFocusToElementRef.current = null;
        }
    }, [composerIDs]);

    useEffect(() => {
        dispatch(composerActions.setHasFocusedComposer(!!focusedComposerID));
    }, [focusedComposerID, dispatch]);

    useBeforeUnload(
        isComposerOpened
            ? c('Info').t`The data you have entered in the draft may not be saved if you leave the page.`
            : ''
    );

    return (
        <ComposeProvider onCompose={handleCompose}>
            {children}
            <ComposerAssistantProvider>
                <div>
                    {composerIDs.map((composerID, i) => (
                        <ComposerFrame
                            key={composerID}
                            index={i}
                            composerID={composerID}
                            count={composerIDs.length}
                            focus={composerID === focusedComposerID}
                            onFocus={handleFocus(composerID)}
                            onClose={handleClose(composerID)}
                            drawerOffset={drawerOffset}
                        />
                    ))}
                </div>
            </ComposerAssistantProvider>
            {sendingFromDefaultAddressModal}
            {sendingOriginalMessageModal}
            {storageCapacityModal}
        </ComposeProvider>
    );
};

export default memo(ComposerContainer);
