import { Ref } from 'react';
import { c } from 'ttag';

interface Props {
    resizeAreaRef: Ref<HTMLButtonElement>;
    enableResize: () => void;
    resetWidth: () => void;
    scrollBarWidth: number;
}

export const ResizeHandle = ({ resizeAreaRef, enableResize, resetWidth, scrollBarWidth }: Props) => {
    return (
        <div className="resize-area-container" style={{ '--scrollbar-width': scrollBarWidth }}>
            <button
                type="button"
                ref={resizeAreaRef}
                className="resize-area-button cursor-col-resize"
                onMouseDown={enableResize}
                onDoubleClick={resetWidth}
            >
                <span className="sr-only">{c('Action')
                    .t`Use your mouse to resize the view. If you're using your keyboard, you can use left and right arrow keys to resize.`}</span>
            </button>
        </div>
    );
};
