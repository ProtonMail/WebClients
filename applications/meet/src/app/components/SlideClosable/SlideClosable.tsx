import { useRef, useState } from 'react';

import { isMobile } from '@proton/shared/lib/helpers/browser';
import clsx from '@proton/utils/clsx';

const CLOSE_THRESHOLD = 80;
const MAX_DRAG = 300;

interface SlideClosableProps {
    className?: string;
    children: React.ReactNode;
    onClose: () => void;
}

export const SlideClosable = ({ className, children, onClose }: SlideClosableProps) => {
    const [dragY, setDragY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const touchStartY = useRef<number>(0);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) {
            return;
        }

        const currentY = e.touches[0].clientY;
        const diff = currentY - touchStartY.current;

        if (diff > 0) {
            setDragY(Math.min(diff, MAX_DRAG));
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);

        if (dragY > CLOSE_THRESHOLD) {
            setIsClosing(true);
            setTimeout(() => {
                onClose();
                setIsClosing(false);
                setDragY(0);
            }, 300);
        } else {
            setDragY(0);
        }
    };

    return (
        <div
            className={clsx('fixed bottom-0 left-0 w-full p-2 bg-transparent z-up', className)}
            style={{
                transform: `translateY(${isClosing ? '100%' : `${dragY}px`})`,
                transition: isDragging ? 'none' : 'transform 0.3s ease-out',
                opacity: isClosing ? 0 : Math.max(0.3, 1 - dragY / MAX_DRAG),
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {isMobile() && (
                <div className="flex justify-center pt-3 pb-1 absolute w-full top-0 left-0">
                    <div
                        className="rounded-full w-custom h-custom menu-handle"
                        style={{
                            '--w-custom': '2.5rem',
                            '--h-custom': '0.25rem',
                        }}
                    />
                </div>
            )}
            {children}
        </div>
    );
};
