/* eslint-disable jsx-a11y/click-events-have-key-events,jsx-a11y/prefer-tag-over-role,jsx-a11y/interactive-supports-focus */
import { type FC, type ReactNode, useEffect, useRef } from 'react';

import type { Maybe, MaybeNull } from '@proton/pass/types';

type ClickableDivProps = {
    className?: string;
    children: ReactNode;
    onClick?: () => void;
    onDoubleClick?: Maybe<() => void>;
};

export const ClickableDiv: FC<ClickableDivProps> = ({ children, className, onClick, onDoubleClick }) => {
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
        <div className={className} onClick={handleClick} onDoubleClick={handleDoubleClick} role="button">
            {children}
        </div>
    );
};
