import { type KeyboardEvent, type MouseEvent, memo, useMemo } from 'react';

import { c } from 'ttag';

import type { DropdownProps } from '@proton/components/components/dropdown/Dropdown';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import { FilterClearButton } from '@proton/pass/components/Item/Filters/FilterClearButton';
import { CountLabel } from '@proton/pass/components/Layout/Dropdown/CountLabel';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { useItemFilters } from '@proton/pass/hooks/items/useItemFilters';
import type { ItemRevision, ItemTypeFilter } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

import './FilterClearButton.scss';

type Props = {
    items: ItemRevision[];
    value: ItemTypeFilter;
    onChange: (value: ItemTypeFilter) => void;
};

const DROPDOWN_SIZE: DropdownProps['size'] = { width: '12rem' };

export const TypeFilter = memo(({ items, value, onChange }: Props) => {
    const itemTypeOptions = useItemFilters();
    const { anchorRef, isOpen, close, toggle } = usePopperAnchor<HTMLButtonElement>();

    const isActive = value !== '*';

    const options = useMemo(
        () =>
            Object.entries(itemTypeOptions).map(([type, { label, icon, itemFilters }]) => ({
                type: type as ItemTypeFilter,
                label,
                icon,
                count:
                    type === '*'
                        ? items.length
                        : items.filter((item) => itemFilters?.includes(item.data.type) ?? item.data.type === type)
                              .length,
            })),
        [items, itemTypeOptions]
    );

    const selectedOption = options.find(({ type }) => type === value) ?? options.find(({ type }) => type === '*');

    const handleClear = (event: MouseEvent | KeyboardEvent) => {
        event.stopPropagation();
        onChange('*');
    };

    return (
        <>
            <div className={clsx('inline-flex flex-nowrap shrink-0', isActive && 'pass-type-filter--active')}>
                <DropdownButton
                    className={clsx(
                        'flex flex-nowrap gap-1.5 grow-0 text-sm text-semibold',
                        isActive && 'pass-type-filter-trigger'
                    )}
                    onClick={toggle}
                    ref={anchorRef}
                    color={isActive ? 'norm' : 'weak'}
                    shape={isActive ? undefined : 'solid'}
                    size="small"
                    title={c('Action').t`Filter vault items`}
                >
                    <span className="text-ellipsis hidden sm:block">
                        {selectedOption?.label}
                        {!isActive && selectedOption && (
                            <span className="hidden md:inline">{` (${selectedOption.count})`}</span>
                        )}
                    </span>
                </DropdownButton>
                {isActive && <FilterClearButton onClear={handleClear} title={c('Action').t`Clear item type filter`} />}
            </div>

            <Dropdown
                anchorRef={anchorRef}
                isOpen={isOpen}
                onClose={close}
                originalPlacement="bottom-start"
                size={DROPDOWN_SIZE}
            >
                <DropdownMenu>
                    {options.map(({ type, count, label, icon }) => (
                        <DropdownMenuButton
                            key={type}
                            onClick={() => onChange(type)}
                            isSelected={type === value}
                            size="small"
                            label={<CountLabel label={label} count={count} />}
                            icon={icon}
                        />
                    ))}
                </DropdownMenu>
            </Dropdown>
        </>
    );
});

TypeFilter.displayName = 'TypeFilterMemo';
