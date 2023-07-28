import { DragEvent, useEffect, useRef, useState } from 'react';

import { ErrorBoundary, useHandler, useMailSettings, useToggle, useWindowSize } from '@proton/components';
import { COMPOSER_MODE } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { ADVANCED_SEARCH_OVERLAY_CLOSE_EVENT, DRAG_ADDRESS_KEY } from '../../constants';
import { computeComposerStyle, getComposerDimension, shouldBeMaximized } from '../../helpers/composerPositioning';
import useComposerDrag from '../../hooks/composer/useComposerDrag';
import { ComposerID } from '../../logic/composers/composerTypes';
import { Breakpoints } from '../../models/utils';
import Composer, { ComposerAction } from './Composer';
import ComposerTitleBar from './ComposerTitleBar';

interface Props {
    index: number;
    count: number;
    focus: boolean;
    breakpoints: Breakpoints;
    onFocus: () => void;
    onClose: () => void;
    composerID: ComposerID;
    drawerOffset: number;
}

const ComposerFrame = ({
    index,
    count,
    focus,
    breakpoints,
    onFocus,
    onClose: inputOnClose,
    composerID,
    drawerOffset,
}: Props) => {
    const [mailSettings] = useMailSettings();
    const composerFrameRef = useRef<HTMLDivElement>(null);
    const composerRef = useRef<ComposerAction>(null);
    // Needed for re-renders when window size changes
    const [, windowHeight] = useWindowSize();

    // Minimized status of the composer
    const { state: minimized, toggle: toggleMinimized } = useToggle(false);

    // Maximized status of the composer
    const { state: maximized, toggle: toggleMaximized } = useToggle(
        mailSettings?.ComposerMode === COMPOSER_MODE.MAXIMIZED
    );

    const composerDimension = getComposerDimension();

    const { style, customClasses } = computeComposerStyle({
        composerDimension,
        index,
        count,
        minimized,
        maximized,
        isNarrow: breakpoints.isNarrow,
        drawerOffset,
    });

    const {
        start: handleStartDragging,
        offset: dragOffset,
        isDragging,
    } = useComposerDrag({
        composerDimension,
        composerIndex: index,
        maximized,
        minimized,
        totalComposers: count,
        drawerOffset,
    });

    // onClose handler can be called in a async handler
    // Input onClose ref can change in the meantime
    const onClose = useHandler(inputOnClose);

    // Current subject comming from the composer
    const [subject, setSubject] = useState('');

    const handleDragEnter = (event: DragEvent) => {
        if (event.dataTransfer?.types.includes(DRAG_ADDRESS_KEY)) {
            onFocus();
        }
    };

    // Automatic maximize if height too small
    useEffect(() => {
        const shouldMaximized = shouldBeMaximized(composerDimension, windowHeight);

        if (!maximized && shouldMaximized) {
            toggleMaximized();
        }
    }, [windowHeight]);

    const handleClose = () => {
        composerRef?.current?.close();
    };

    const handleClick = () => {
        if (minimized && !isDragging) {
            toggleMinimized();
        }
        onFocus();
    };

    const handleFocus = () => {
        if (!focus) {
            document.dispatchEvent(new CustomEvent(ADVANCED_SEARCH_OVERLAY_CLOSE_EVENT));
            document.dispatchEvent(new CustomEvent('dropdownclose'));
        }

        onFocus();
    };

    return (
        <div
            ref={composerFrameRef}
            className={clsx([
                `composer rounded flex flex-column outline-none ${customClasses}`,
                !focus && 'composer--is-blur',
                minimized && 'composer--is-minimized',
                maximized && 'composer--is-maximized',
            ])}
            style={{ ...style, '--composer-drag-offset': `${dragOffset}px` }}
            onFocus={handleFocus}
            onClick={handleClick}
            onDragEnter={handleDragEnter}
            tabIndex={-1}
            data-testid={composerID}
        >
            <ComposerTitleBar
                title={subject}
                minimized={minimized}
                maximized={maximized}
                toggleMinimized={toggleMinimized}
                toggleMaximized={toggleMaximized}
                onClose={handleClose}
                handleStartDragging={handleStartDragging}
            />
            <ErrorBoundary>
                <Composer
                    ref={composerRef}
                    composerFrameRef={composerFrameRef}
                    toggleMinimized={toggleMinimized}
                    toggleMaximized={toggleMaximized}
                    onFocus={onFocus}
                    onClose={onClose}
                    onSubject={(subject) => setSubject(subject)}
                    isFocused={focus}
                    composerID={composerID}
                />
            </ErrorBoundary>
        </div>
    );
};

export default ComposerFrame;
