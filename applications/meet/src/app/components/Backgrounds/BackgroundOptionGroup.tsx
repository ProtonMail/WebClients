import type { KeyboardEvent, KeyboardEventHandler, ReactNode, Ref } from 'react';
import { Fragment, useRef } from 'react';

import type { BackgroundEffect } from '@proton/meet/store/slices/backgroundSlice';
import noop from '@proton/utils/noop';

import { BackgroundTile } from './BackgroundTile';

export interface BackgroundOptionRemoval {
    label: string;
    /** Rejects while the background is still there, which is what keeps focus on it. */
    onRemove: () => Promise<void>;
}

export interface BackgroundOption {
    effect: BackgroundEffect;
    label: string;
    icon?: ReactNode;
    thumbnailUrl?: string;
    removal?: BackgroundOptionRemoval;
    isPlaceholder?: boolean;
}

export interface BackgroundActionTileProps {
    ref: Ref<HTMLButtonElement>;
    tabIndex: number;
    onKeyDown: KeyboardEventHandler<HTMLButtonElement>;
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
    renderActionTile?: (props: BackgroundActionTileProps) => ReactNode;
    actionTileIndex?: number;
}

type GroupItem = { type: 'option'; option: BackgroundOption } | { type: 'action' };

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
    renderActionTile,
    actionTileIndex = options.length,
}: BackgroundOptionGroupProps) => {
    const tileRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const items: GroupItem[] = options.map((option) => ({ type: 'option', option }));

    if (renderActionTile) {
        items.splice(Math.min(Math.max(actionTileIndex, 0), options.length), 0, { type: 'action' });
    }

    const selectedIndex = items.findIndex((item) => item.type === 'option' && item.option.effect === selectedEffect);
    const firstOptionIndex = items.findIndex((item) => item.type === 'option');
    // Entering the group lands on the background in use, or on the first one when none is.
    const tabbableIndex = selectedIndex === -1 ? Math.max(firstOptionIndex, 0) : selectedIndex;

    const itemCount = items.length;

    // Re-selecting the effect already in use is skipped, since every call restarts the processor.
    const handleSelect = ({ effect, isPlaceholder }: BackgroundOption) => {
        if (disabled || isPlaceholder || effect === selectedEffect) {
            return;
        }

        onSelect(effect);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
        const targetIndex = getTargetIndex(event.key, currentIndex, items.length);

        if (targetIndex === null) {
            return;
        }

        event.preventDefault();

        tileRefs.current[targetIndex]?.focus();

        const target = items[targetIndex];

        if (target.type === 'option') {
            handleSelect(target.option);
        }
    };

    return (
        <div role="radiogroup" aria-label={label} aria-describedby={describedById} className={className}>
            {items.map((item, index) => {
                const setTileRef = (tile: HTMLButtonElement | null) => {
                    tileRefs.current[index] = tile;
                };
                const tabIndex = index === tabbableIndex ? 0 : -1;
                const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => handleKeyDown(event, index);

                if (item.type === 'action') {
                    return (
                        <Fragment key="action">{renderActionTile?.({ ref: setTileRef, tabIndex, onKeyDown })}</Fragment>
                    );
                }

                const { effect, label: optionLabel, icon, thumbnailUrl, removal, isPlaceholder } = item.option;

                const tileRemoval = removal && {
                    ...removal,
                    onRemove: () => {
                        const hadFocus = !!tileRefs.current[index]?.parentElement?.contains(document.activeElement);
                        const neighbour = tileRefs.current[index + 1 < itemCount ? index + 1 : index - 1];

                        removal
                            .onRemove()
                            .then(() => {
                                if (hadFocus) {
                                    neighbour?.focus();
                                }
                            })
                            .catch(noop);
                    },
                };

                return (
                    <BackgroundTile
                        key={effect}
                        ref={setTileRef}
                        label={optionLabel}
                        isSelected={effect === selectedEffect}
                        isPending={pendingEffect === effect}
                        isPlaceholder={isPlaceholder}
                        disabled={disabled}
                        tabIndex={tabIndex}
                        onClick={() => handleSelect(item.option)}
                        onKeyDown={onKeyDown}
                        thumbnailUrl={thumbnailUrl}
                        removal={tileRemoval || undefined}
                        className={tileClassName}
                    >
                        {icon}
                    </BackgroundTile>
                );
            })}
        </div>
    );
};
