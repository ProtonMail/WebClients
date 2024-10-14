import { type FC, useMemo } from 'react';

import { c } from 'ttag';

import type { DropdownProps, IconName } from '@proton/components';
import { Dropdown, DropdownButton, DropdownMenu, Icon, usePopperAnchor } from '@proton/components';
import { CountLabel } from '@proton/pass/components/Layout/Dropdown/CountLabel';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { itemTypeToIconName } from '@proton/pass/components/Layout/Icon/ItemIcon';
import type { ItemRevisionWithOptimistic, ItemTypeFilter } from '@proton/pass/types';

type Props = {
    items: ItemRevisionWithOptimistic[];
    value: ItemTypeFilter;
    onChange: (value: ItemTypeFilter) => void;
};

const DROPDOWN_SIZE: DropdownProps['size'] = { width: '12rem' };

export const getItemTypeOptions = (): Record<ItemTypeFilter, { label: string; icon: IconName }> => ({
    '*': {
        label: c('Label').t`All`,
        icon: 'grid-2',
    },
    login: {
        label: c('Label').t`Logins`,
        icon: itemTypeToIconName.login,
    },
    alias: {
        label: c('Label').t`Aliases`,
        icon: itemTypeToIconName.alias,
    },
    creditCard: {
        label: c('Label').t`Cards`,
        icon: itemTypeToIconName.creditCard,
    },
    note: {
        label: c('Label').t`Notes`,
        icon: itemTypeToIconName.note,
    },
    identity: {
        label: c('Label').t`Identities`,
        icon: itemTypeToIconName.identity,
    },
});

export const TypeFilter: FC<Props> = ({ items, value, onChange }) => {
    const { anchorRef, isOpen, close, toggle } = usePopperAnchor<HTMLButtonElement>();

    const options = useMemo(
        () =>
            Object.entries(getItemTypeOptions()).map(([type, { label, icon }]) => ({
                type: type as ItemTypeFilter,
                label,
                icon,
                count: type === '*' ? items.length : items.filter((item) => item.data.type === type).length,
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
};
