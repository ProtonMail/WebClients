import clsx from '@proton/utils/clsx';

import { ResizeHandle } from '../../components/list/ResizeHandle';
import { getResizeGrip, useCardResize } from './cardResize';
import type { PanelSide } from './panelSide';

interface Props {
    side: PanelSide;
    cardWidth: number;
    onResize: (width: number) => void;
    onReset: () => void;
}

const LumoFloatingPanelResizeEdge = ({ side, cardWidth, onResize, onReset }: Props) => {
    const resizeGrip = getResizeGrip(side);
    const startResize = useCardResize({ startWidth: cardWidth, handlePosition: resizeGrip.position, onResize });

    return (
        <div
            className={clsx(
                'lumo-floating-panel-resize-edge',
                !resizeGrip.spansPrompt && 'lumo-floating-panel-resize-edge--card-only'
            )}
        >
            <ResizeHandle
                resizeAreaRef={null}
                enableResize={startResize}
                resetWidth={onReset}
                scrollBarWidth={0}
                position={resizeGrip.position}
            />
        </div>
    );
};

export default LumoFloatingPanelResizeEdge;
