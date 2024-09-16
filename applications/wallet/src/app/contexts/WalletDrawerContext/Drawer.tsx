import type { CSSProperties, PropsWithChildren } from 'react';
import { useRef } from 'react';

import { Scroll } from '@proton/atoms';
import { useHotkeys } from '@proton/components/hooks';
import clsx from '@proton/utils/clsx';

import { DrawerHeader } from './DrawerHeader';

import './Drawer.scss';

export interface Props {
    open: boolean;
    onClose?: () => void;

    title?: string;

    style?: CSSProperties;
    className?: string;
    bg?: 'bg-weak' | 'bg-norm';
}

export const Drawer = ({
    open,
    onClose,
    title,
    style,
    className,
    bg = 'bg-weak',
    children,
}: PropsWithChildren<Props>) => {
    const ref = useRef(document.body);

    useHotkeys(ref, [
        [
            'Escape',
            (e) => {
                e.stopPropagation();
                onClose?.();
            },
        ],
    ]);

    return (
        <>
            <div
                className="fixed top-0 left-0 h-full w-full"
                onClick={() => onClose?.()}
                style={{
                    background: 'var(--backdrop-norm)',
                    transform: 'opacity',
                    transitionDuration: '300ms',
                }}
            />
            <div
                className={clsx(
                    'absolute top-0 right-0 h-full w-custom max-w-full flex flex-column flex-nowrap',
                    bg,
                    className
                )}
                style={{ ...style, transform: open ? undefined : 'translateX(100%)', transitionDuration: '300ms' }}
            >
                <DrawerHeader title={title} onClose={() => onClose?.()} bg={bg} />
                <Scroll className="drawer-scroll-container">
                    <div className="pb-6 px-6">{children}</div>
                </Scroll>
            </div>
        </>
    );
};
