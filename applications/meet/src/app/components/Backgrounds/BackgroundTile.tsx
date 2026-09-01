import type { KeyboardEvent, KeyboardEventHandler } from 'react';
import { forwardRef } from 'react';

import { IcCross } from '@proton/icons/icons/IcCross';
import clsx from '@proton/utils/clsx';

import './BackgroundTile.scss';

export const BACKGROUND_TILE_CLASS =
    'background-tile relative overflow-hidden flex items-center justify-center w-full ratio-square border border-2 color-norm transition-all';

export interface BackgroundRemoval {
    onRemove: () => void;
    label: string;
}

interface BackgroundTileProps {
    label: string;
    isSelected: boolean;
    onClick: () => void;
    onKeyDown?: KeyboardEventHandler<HTMLButtonElement>;
    isPending?: boolean;
    isPlaceholder?: boolean;
    disabled?: boolean;
    tabIndex?: number;
    className?: string;
    thumbnailUrl?: string;
    removal?: BackgroundRemoval;
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
            isPlaceholder = false,
            disabled,
            tabIndex,
            className,
            thumbnailUrl,
            removal,
            children,
        },
        ref
    ) => {
        const canRemove = !!removal && !disabled && !isPlaceholder;

        const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
            if (canRemove && (event.key === 'Delete' || event.key === 'Backspace')) {
                event.preventDefault();
                removal.onRemove();
                return;
            }

            onKeyDown?.(event);
        };

        const tile = (
            // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
            <button
                ref={ref}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-busy={isPending || isPlaceholder}
                aria-label={label}
                title={label}
                aria-disabled={disabled || isPlaceholder}
                aria-keyshortcuts={canRemove ? 'Delete' : undefined}
                tabIndex={tabIndex}
                onClick={() => {
                    if (!disabled && !isPlaceholder) {
                        onClick();
                    }
                }}
                onKeyDown={handleKeyDown}
                className={clsx(
                    BACKGROUND_TILE_CLASS,
                    isPlaceholder && 'background-tile-placeholder',
                    disabled && 'opacity-50',
                    !removal && className
                )}
            >
                {thumbnailUrl && (
                    <img
                        src={thumbnailUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        // A slow click would otherwise start a native image drag.
                        draggable={false}
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    />
                )}
                <span className="relative flex items-center justify-center">{children}</span>
            </button>
        );

        if (!removal) {
            return tile;
        }

        return (
            <div className={clsx('background-tile-container relative', className)}>
                {tile}

                <button
                    type="button"
                    aria-label={removal.label}
                    title={removal.label}
                    tabIndex={-1}
                    onClick={removal.onRemove}
                    className="background-tile-delete absolute top-custom right-custom w-custom h-custom flex items-center justify-center rounded-full border border-2"
                    style={{
                        '--top-custom': '-0.25rem',
                        '--right-custom': '-0.25rem',
                        // At least the 24px minimum target size, badge border included.
                        '--w-custom': '1.5rem',
                        '--h-custom': '1.5rem',
                    }}
                >
                    <IcCross size={3} />
                </button>
            </div>
        );
    }
);

BackgroundTile.displayName = 'BackgroundTile';
