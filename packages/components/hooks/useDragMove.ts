import { useEffect, useMemo, DragEvent, ReactNode, useRef } from 'react';
import { createPortal } from 'react-dom';

interface DragMoveContentProps<T> {
    data?: T;
    dragging?: boolean;
    children: ReactNode;
}

interface UseDragMoveParams {
    dragging: boolean;
    setDragging: (value: boolean) => void;
    format?: string;
    formatter?: (value: any) => string;
}

function useDragMove({ dragging, setDragging, format = 'text/plain', formatter = (str) => str }: UseDragMoveParams) {
    const container = useRef<HTMLDivElement>();
    const transferData = useRef<any>();

    const handleDragStart = (event: DragEvent<HTMLTableRowElement>) => {
        if (!container.current) {
            container.current = document.createElement('div');
            container.current.className = 'absolute';
        }
        document.body.appendChild(container.current);
        event.dataTransfer.setDragImage(container.current, 0, 0);
        event.dataTransfer.setData(format, formatter(transferData.current));
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
            function Component<T>({ children, data, dragging }: DragMoveContentProps<T>) {
                transferData.current = data;

                useEffect(() => {
                    return () => {
                        transferData.current = undefined;
                    };
                }, []);

                if (dragging && container.current) {
                    return createPortal(children, container.current);
                }
                return null;
            },
        []
    );

    return { dragging, handleDragEnd, handleDragStart, DragMoveContent };
}

export default useDragMove;
