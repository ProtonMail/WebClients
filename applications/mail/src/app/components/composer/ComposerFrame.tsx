import { useEffect, DragEvent, useState, useRef } from 'react';
import {
    classnames,
    useToggle,
    useMailSettings,
    useHandler,
    ErrorBoundary,
    getCustomSizingClasses,
} from '@proton/components';
import { COMPOSER_MODE } from '@proton/shared/lib/constants';
import ComposerTitleBar from './ComposerTitleBar';
import { computeComposerStyle, shouldBeMaximized } from '../../helpers/composerPositioning';
import { WindowSize, Breakpoints } from '../../models/utils';
import { DRAG_ADDRESS_KEY } from '../../constants';
import Composer, { ComposerAction } from './Composer';
import useComposerDrag from '../../hooks/composer/useComposerDrag';

interface Props {
    messageID: string;
    index: number;
    count: number;
    focus: boolean;
    windowSize: WindowSize;
    breakpoints: Breakpoints;
    onFocus: () => void;
    onClose: () => void;
}

const ComposerFrame = ({
    messageID,
    index,
    count,
    focus,
    windowSize,
    breakpoints,
    onFocus,
    onClose: inputOnClose,
}: Props) => {
    const [mailSettings] = useMailSettings();
    const composerFrameRef = useRef<HTMLDivElement>(null);
    const composerRef = useRef<ComposerAction>(null);

    // Minimized status of the composer
    const { state: minimized, toggle: toggleMinimized } = useToggle(false);

    // Maximized status of the composer
    const { state: maximized, toggle: toggleMaximized } = useToggle(
        mailSettings?.ComposerMode === COMPOSER_MODE.MAXIMIZED
    );

    const style = computeComposerStyle(index, count, focus, minimized, maximized, breakpoints.isNarrow, windowSize);
    const customClassnames = getCustomSizingClasses(style);
    const {
        start: handleStartDragging,
        offset: dragOffset,
        isDragging,
    } = useComposerDrag({
        composerIndex: index,
        isNarrow: breakpoints.isNarrow,
        maximized,
        minimized,
        windowWidth: windowSize.width,
        totalComposers: count,
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
        const shouldMaximized = shouldBeMaximized(windowSize.height);

        if (!maximized && shouldMaximized) {
            toggleMaximized();
        }
    }, [windowSize.height]);

    const handleClose = () => {
        composerRef?.current?.close();
    };

    const handleClick = () => {
        if (minimized && !isDragging) {
            toggleMinimized();
        }
        onFocus();
    };

    return (
        <div
            ref={composerFrameRef}
            className={classnames([
                `composer rounded-xl flex flex-column no-outline ${customClassnames}`,
                !focus && 'composer--is-blur',
                minimized && 'composer--is-minimized',
                maximized && 'composer--is-maximized',
            ])}
            style={{ ...style, '--composer-drag-offset': `${dragOffset}px` }}
            onFocus={onFocus}
            onClick={handleClick}
            onDragEnter={handleDragEnter}
            tabIndex={-1}
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
                    messageID={messageID}
                    composerFrameRef={composerFrameRef}
                    breakpoints={breakpoints}
                    toggleMinimized={toggleMinimized}
                    toggleMaximized={toggleMaximized}
                    onFocus={onFocus}
                    onClose={onClose}
                    onSubject={(subject) => setSubject(subject)}
                    isFocused={focus}
                />
            </ErrorBoundary>
        </div>
    );
};

export default ComposerFrame;
