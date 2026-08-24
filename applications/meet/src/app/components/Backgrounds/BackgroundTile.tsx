import type { KeyboardEventHandler } from 'react';
import { forwardRef } from 'react';

import clsx from '@proton/utils/clsx';

import './BackgroundTile.scss';

interface BackgroundTileProps {
    label: string;
    isSelected: boolean;
    onClick: () => void;
    onKeyDown?: KeyboardEventHandler<HTMLButtonElement>;
    isPending?: boolean;
    disabled?: boolean;
    tabIndex?: number;
    className?: string;
    thumbnailUrl?: string;
    children?: React.ReactNode;
}

export const BackgroundTile = forwardRef<HTMLButtonElement, BackgroundTileProps>(
    (
        {
            label,
            isSelected,
            onClick,
            onKeyDown,
            isPending = false,
            disabled,
            tabIndex,
            className,
            thumbnailUrl,
            children,
        },
        ref
    ) => {
        return (
            // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
            <button
                ref={ref}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-busy={isPending}
                aria-label={label}
                title={label}
                aria-disabled={disabled}
                tabIndex={tabIndex}
                onClick={() => {
                    if (!disabled) {
                        onClick();
                    }
                }}
                onKeyDown={onKeyDown}
                className={clsx(
                    'background-tile relative overflow-hidden flex items-center justify-center w-full ratio-square border border-2 color-norm transition-all',
                    disabled && 'opacity-50',
                    className
                )}
            >
                {thumbnailUrl && (
                    <img
                        src={thumbnailUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        // A slow click would otherwise start a native image drag instead of picking
                        // the background.
                        draggable={false}
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    />
                )}
                <span className="relative flex items-center justify-center">{children}</span>
            </button>
        );
    }
);

BackgroundTile.displayName = 'BackgroundTile';
