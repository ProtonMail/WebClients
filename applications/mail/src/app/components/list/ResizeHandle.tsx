import type { Ref } from 'react';

import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import './ResizeHandle.scss';

export enum ResizeHandlePosition {
    LEFT = 'left',
    RIGHT = 'right',
}
interface Props {
    resizeAreaRef: Ref<HTMLButtonElement>;
    enableResize: (event: React.MouseEvent) => void;
    resetWidth: () => void;
    scrollBarWidth: number;
    isAbsolute?: boolean;
    position?: ResizeHandlePosition;
}

export const ResizeHandle = ({
    resizeAreaRef,
    enableResize,
    resetWidth,
    scrollBarWidth,
    isAbsolute = false,
    position = ResizeHandlePosition.RIGHT,
}: Props) => {
    return (
        <div className="resize-area-container" style={{ '--scrollbar-width': scrollBarWidth }}>
            <button
                type="button"
                ref={resizeAreaRef}
                className={clsx(
                    'resize-area-button cursor-col-resize',
                    isAbsolute ? 'absolute' : '',
                    position === ResizeHandlePosition.RIGHT ? 'right-0' : '',
                    position === ResizeHandlePosition.LEFT ? 'left-0' : ''
                )}
                data-position={position}
                title="Drag to resize or double-click to reset"
                onMouseDown={enableResize}
                onDoubleClick={resetWidth}
                aria-label={c('Action').t`Resize panel`}
            >
                <div
                    className={clsx(
                        'absolute h-10 w-0.5 bg-primary rounded opacity-0 hover:opacity-70',
                        position === ResizeHandlePosition.RIGHT ? 'left-0' : 'right-0'
                    )}
                    aria-hidden="true"
                ></div>

                <span className="sr-only">{c('Action')
                    .t`Use your mouse to resize the view. If you're using your keyboard, you can use left and right arrow keys to resize.`}</span>
            </button>
        </div>
    );
};
