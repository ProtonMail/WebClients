import { ReactNode, memo, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useBeforeUnload, useDrawerWidth } from '@proton/components';

import ComposerFrame from '../components/composer/ComposerFrame';
import { MAX_ACTIVE_COMPOSER_DESKTOP, MAX_ACTIVE_COMPOSER_MOBILE } from '../helpers/composerPositioning';
import { useCompose } from '../hooks/composer/useCompose';
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

const ComposerContainer = ({ breakpoints, children }: Props) => {
    const dispatch = useAppDispatch();
    const composerIDs = useAppSelector(selectOpenedComposersIds);
    const [focusedComposerID, setFocusedComposerID] = useState<string>();
    const drawerOffset = useDrawerWidth();
    const returnFocusToElementRef = useRef<HTMLElement | null>(null);
    const isComposerOpened = composerIDs.length > 0;

    useClickMailContent(() => setFocusedComposerID(undefined));

    const maxActiveComposer = breakpoints.isNarrow ? MAX_ACTIVE_COMPOSER_MOBILE : MAX_ACTIVE_COMPOSER_DESKTOP;

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
