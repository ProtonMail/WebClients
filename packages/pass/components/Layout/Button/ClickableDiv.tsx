/* eslint-disable jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions,jsx-a11y/prefer-tag-over-role,jsx-a11y/interactive-supports-focus */
import { type FC, type ReactNode, useEffect, useRef, useState } from 'react';

import type { Maybe, MaybeNull } from '@proton/pass/types';

type ClickableDivProps = {
    className?: string;
    onClick?: () => void;
    onDoubleClick?: Maybe<() => void>;
    children: ((props: { hovering: boolean }) => ReactNode) | ReactNode;
};

export const ClickableDiv: FC<ClickableDivProps> = ({ children, className, onClick, onDoubleClick }) => {
    const [hovering, setHovering] = useState(false);
    const clickTimeoutRef = useRef<MaybeNull<NodeJS.Timeout>>(null);

    const handleClick = () => {
        if (!onClick) return;

        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
            return;
        }

        clickTimeoutRef.current = setTimeout(() => {
            onClick();
            clickTimeoutRef.current = null;
        }, 200);
    };

    const handleDoubleClick = () => {
        if (!onDoubleClick) return;

        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
        }

        onDoubleClick();
    };

    useEffect(
        () => () => {
            if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
        },
        []
    );

    return (
        <div
            className={className}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            role="button"
        >
            {typeof children === 'function' ? children({ hovering }) : children}
        </div>
    );
};
