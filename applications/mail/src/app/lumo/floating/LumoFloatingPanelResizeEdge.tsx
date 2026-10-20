import { ResizeHandle } from '../../components/list/ResizeHandle';
import { getResizeGripPosition, useCardResize } from './cardResize';
import type { PanelSide } from './panelSide';

interface Props {
    side: PanelSide;
    cardWidth: number;
    onResize: (width: number) => void;
    onReset: () => void;
}

const LumoFloatingPanelResizeEdge = ({ side, cardWidth, onResize, onReset }: Props) => {
    const gripPosition = getResizeGripPosition(side);
    const startResize = useCardResize({ startWidth: cardWidth, handlePosition: gripPosition, onResize });

    return (
        <div className="lumo-floating-panel-resize-edge">
            <ResizeHandle
                resizeAreaRef={null}
                enableResize={startResize}
                resetWidth={onReset}
                scrollBarWidth={0}
                position={gripPosition}
            />
        </div>
    );
};

export default LumoFloatingPanelResizeEdge;
