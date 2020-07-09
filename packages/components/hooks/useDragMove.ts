import { useEffect, useMemo, DragEvent, ReactNode, useRef } from 'react';
import { createPortal } from 'react-dom';

interface DragMoveContentProps<T> {
    data?: T;
    children: ReactNode;
}

interface UseDragMoveParams {
    dragging: boolean;
    setDragging: (value: boolean) => void;
}

function useDragMove({ dragging, setDragging }: UseDragMoveParams) {
    const container = useRef<HTMLDivElement>();
    const transferData = useRef<any>();

    const handleDragStart = (event: DragEvent<HTMLTableRowElement>) => {
        if (!container.current) {
            container.current = document.createElement('div');
            container.current.className = 'absolute';
        }
        document.body.appendChild(container.current);
        event.dataTransfer.setDragImage(container.current, 0, 0);
        event.dataTransfer.setData('text/plain', JSON.stringify(transferData.current));
        setDragging(true);
    };

    const handleDragEnd = () => {
        if (container.current) {
            document.body.removeChild(container.current);
        }

        setDragging(false);
    };

    const DragMoveContent = useMemo(
        () =>
            function Component<T>({ children, data }: DragMoveContentProps<T>) {
                transferData.current = data;

                useEffect(() => () => (transferData.current = undefined), []);

                if (dragging && container.current) {
                    return createPortal(children, container.current);
                }
                return null;
            },
        [dragging]
    );

    return { dragging, handleDragEnd, handleDragStart, DragMoveContent };
}

export default useDragMove;
