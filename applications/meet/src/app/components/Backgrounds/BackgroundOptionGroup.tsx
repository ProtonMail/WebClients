import type { KeyboardEvent, ReactNode } from 'react';
import { useRef } from 'react';

import type { BackgroundEffect } from '@proton/meet/store/slices/backgroundSlice';

import { BackgroundTile } from './BackgroundTile';

export interface BackgroundOption {
    effect: BackgroundEffect;
    label: string;
    icon?: ReactNode;
    thumbnailUrl?: string;
}

interface BackgroundOptionGroupProps {
    label: string;
    options: BackgroundOption[];
    selectedEffect: BackgroundEffect;
    pendingEffect?: BackgroundEffect | null;
    onSelect: (effect: BackgroundEffect) => void;
    disabled?: boolean;
    describedById?: string;
    className?: string;
    tileClassName?: string;
}

const getTargetIndex = (key: string, currentIndex: number, count: number) => {
    switch (key) {
        case 'ArrowRight':
        case 'ArrowDown':
            return (currentIndex + 1) % count;
        case 'ArrowLeft':
        case 'ArrowUp':
            return (currentIndex - 1 + count) % count;
        case 'Home':
            return 0;
        case 'End':
            return count - 1;
        default:
            return null;
    }
};

/**
 * Radio group of background options. The whole group is a single tab stop that the arrow keys move
 * within, and arrowing onto an option applies it, so a keyboard user always hears the label of the
 * background they are actually on. Tabbing in only moves focus, since entering the group is not a
 * choice yet.
 */
export const BackgroundOptionGroup = ({
    label,
    options,
    selectedEffect,
    pendingEffect = null,
    onSelect,
    disabled = false,
    describedById,
    className,
    tileClassName,
}: BackgroundOptionGroupProps) => {
    const tileRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const selectedIndex = options.findIndex((option) => option.effect === selectedEffect);
    const tabbableIndex = selectedIndex === -1 ? 0 : selectedIndex;

    // Re-selecting the effect already in use is skipped, since every call restarts the processor.
    const handleSelect = (effect: BackgroundEffect) => {
        if (disabled || effect === selectedEffect) {
            return;
        }

        onSelect(effect);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
        const targetIndex = getTargetIndex(event.key, currentIndex, options.length);

        if (targetIndex === null) {
            return;
        }

        event.preventDefault();

        tileRefs.current[targetIndex]?.focus();
        handleSelect(options[targetIndex].effect);
    };

    return (
        <div role="radiogroup" aria-label={label} aria-describedby={describedById} className={className}>
            {options.map(({ effect, label: optionLabel, icon, thumbnailUrl }, index) => (
                <BackgroundTile
                    key={effect}
                    ref={(tile) => {
                        tileRefs.current[index] = tile;
                    }}
                    label={optionLabel}
                    isSelected={effect === selectedEffect}
                    isPending={pendingEffect === effect}
                    disabled={disabled}
                    tabIndex={index === tabbableIndex ? 0 : -1}
                    onClick={() => handleSelect(effect)}
                    onKeyDown={(event) => handleKeyDown(event, index)}
                    thumbnailUrl={thumbnailUrl}
                    className={tileClassName}
                >
                    {icon}
                </BackgroundTile>
            ))}
        </div>
    );
};
