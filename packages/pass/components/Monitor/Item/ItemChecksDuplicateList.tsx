import { type FC, useCallback, useLayoutEffect, useRef, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';

import { getItemKey } from '../../../lib/items/item.utils';
import type { ItemRevision } from '../../../types/data/items';
import { ItemTag } from '../../Item/List/ItemTag';
import { DropdownMenuButton } from '../../Layout/Dropdown/DropdownMenuButton';

const BTN_STYLES = {
    '--button-default-background-color': 'var(--interaction-weak-major-1)',
    '--button-hover-background-color': 'var(--interaction-weak-major-2)',
    '--button-active-background-color': 'var(--interaction-weak-major-2)',
    '--button-default-text-color': 'var(--interaction-weak-contrast)',
    '--button-hover-text-color': 'var(--interaction-weak-contrast)',
    '--button-active-text-color': 'var(--interaction-weak-contrast)',
};

const DUPLICATE_CHIP_GAP_PX = 8;

const getHiddenDuplicatesMoreLabel = (count: number) =>
    c('Description').ngettext(msgid`${count} more`, `${count} more`, count);

type ItemChecksDuplicateListProps = {
    items: ItemRevision[];
    onItemClick: (item: ItemRevision) => void;
};

const DuplicateChipButton: FC<{ item: ItemRevision; onClick: () => void }> = ({ item, onClick }) => (
    <Button className="flex shrink-0 border-none" style={BTN_STYLES} size="small" onClick={onClick}>
        <ItemTag {...item} />
    </Button>
);

export const ItemChecksDuplicateList: FC<ItemChecksDuplicateListProps> = ({ items, onItemClick }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const measureRef = useRef<HTMLDivElement>(null);
    const [visibleCount, setVisibleCount] = useState(items.length);
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const recomputeVisibleCount = useCallback(() => {
        const container = containerRef.current;
        const measure = measureRef.current;

        if (!container || !measure || items.length === 0) {
            setVisibleCount(0);
            return;
        }

        const maxWidth = container.offsetWidth;
        if (maxWidth === 0) return;

        const chipWidths = Array.from(measure.querySelectorAll('[data-duplicate-chip]')).map(
            (element) => (element as HTMLElement).offsetWidth
        );

        const moreWidthByHiddenCount = new Map<number, number>();
        measure.querySelectorAll('[data-duplicate-more]').forEach((element) => {
            const hidden = Number((element as HTMLElement).dataset.hiddenCount);
            if (!Number.isNaN(hidden)) {
                moreWidthByHiddenCount.set(hidden, (element as HTMLElement).offsetWidth);
            }
        });

        let nextVisibleCount = 0;

        for (let visible = items.length; visible >= 0; visible -= 1) {
            const hidden = items.length - visible;
            let width = 0;

            for (let index = 0; index < visible; index += 1) {
                if (index > 0) width += DUPLICATE_CHIP_GAP_PX;
                width += chipWidths[index] ?? 0;
            }

            if (hidden > 0) {
                if (visible > 0) width += DUPLICATE_CHIP_GAP_PX;
                width += moreWidthByHiddenCount.get(hidden) ?? 0;
            }

            if (width <= maxWidth) {
                nextVisibleCount = visible;
                break;
            }
        }

        setVisibleCount(nextVisibleCount);
    }, [items]);

    useLayoutEffect(() => {
        recomputeVisibleCount();

        const container = containerRef.current;
        if (!container) return;

        const observer = new ResizeObserver(() => recomputeVisibleCount());
        observer.observe(container);

        return () => observer.disconnect();
    }, [recomputeVisibleCount]);

    const hiddenCount = items.length - visibleCount;

    return (
        <div className="pass-item-checks-duplicates-wrap">
            <div ref={containerRef} className="pass-item-checks-duplicates">
                {items.slice(0, visibleCount).map((item) => (
                    <DuplicateChipButton key={getItemKey(item)} item={item} onClick={() => onItemClick(item)} />
                ))}
                {hiddenCount > 0 && (
                    <button type="button" ref={anchorRef} className="pass-item-checks-duplicates-more" onClick={toggle}>
                        {getHiddenDuplicatesMoreLabel(hiddenCount)}
                    </button>
                )}
            </div>
            <div ref={measureRef} className="pass-item-checks-duplicates-measure" aria-hidden>
                {items.map((item) => (
                    <div
                        key={getItemKey(item)}
                        data-duplicate-chip
                        className="pass-item-checks-duplicates-measure-chip"
                    >
                        <DuplicateChipButton item={item} onClick={() => {}} />
                    </div>
                ))}
                {items.map((_, index) => {
                    const hidden = items.length - index;

                    if (hidden <= 0) return null;

                    return (
                        <span
                            key={hidden}
                            data-duplicate-more
                            data-hidden-count={hidden}
                            className="pass-item-checks-duplicates-more"
                        >
                            {getHiddenDuplicatesMoreLabel(hidden)}
                        </span>
                    );
                })}
            </div>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close} originalPlacement="bottom-start">
                <DropdownMenu>
                    {items.map((item) => (
                        <DropdownMenuButton
                            key={getItemKey(item)}
                            label={<ItemTag {...item} />}
                            onClick={() => onItemClick(item)}
                        />
                    ))}
                </DropdownMenu>
            </Dropdown>
        </div>
    );
};
