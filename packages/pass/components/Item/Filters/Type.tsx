import { memo, useMemo } from 'react';

import { c } from 'ttag';

import type { DropdownProps } from '@proton/components';
import { Dropdown, DropdownButton, DropdownMenu, Icon, usePopperAnchor } from '@proton/components';
import { CountLabel } from '@proton/pass/components/Layout/Dropdown/CountLabel';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { useItemFilters } from '@proton/pass/hooks/items/useItemFilters';
import type { ItemRevision, ItemTypeFilter } from '@proton/pass/types';

type Props = {
    items: ItemRevision[];
    value: ItemTypeFilter;
    onChange: (value: ItemTypeFilter) => void;
};

const DROPDOWN_SIZE: DropdownProps['size'] = { width: '12rem' };

export const TypeFilter = memo(({ items, value, onChange }: Props) => {
    const itemTypeOptions = useItemFilters();
    const { anchorRef, isOpen, close, toggle } = usePopperAnchor<HTMLButtonElement>();

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
        [items]
    );

    const selectedOption = options.find(({ type }) => type === value)!;

    return (
        <>
            <DropdownButton
                className="flex flex-nowrap gap-2 grow-0 text-sm text-semibold"
                onClick={toggle}
                ref={anchorRef}
                color="weak"
                shape="solid"
                size="small"
                title={c('Action').t`Filter vault items`}
            >
                <Icon name={selectedOption.icon} className="shrink-0" />
                <span className="text-ellipsis hidden sm:block">
                    {`${selectedOption.label}`} <span className="hidden md:inline">({selectedOption.count})</span>
                </span>
            </DropdownButton>

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
