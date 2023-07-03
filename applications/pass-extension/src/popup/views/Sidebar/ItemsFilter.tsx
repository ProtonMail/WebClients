import { type VFC, useMemo } from 'react';

import { c } from 'ttag';

import type { DropdownProps, IconName } from '@proton/components';
import { Dropdown, DropdownButton, DropdownMenu, Icon, usePopperAnchor } from '@proton/components';
import type { ItemTypeFilter } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';

import { useFeatureFlag } from '../../../shared/hooks/useFeatureFlag';
import { itemTypeToIconName } from '../../../shared/items';
import { DropdownMenuButton } from '../../components/Dropdown/DropdownMenuButton';
import { useItems } from '../../hooks/useItems';

interface ItemsFilterProps {
    value: ItemTypeFilter;
    onChange: (value: ItemTypeFilter) => void;
}

const DROPDOWN_SIZE: DropdownProps['size'] = { width: '11rem' };

const getOptionsWithoutCount = (): { [key in ItemTypeFilter]: { label: string; icon: IconName } } => ({
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
        label: c('Label').t`Credit Cards`,
        icon: itemTypeToIconName.creditCard,
    },
    note: {
        label: c('Label').t`Notes`,
        icon: itemTypeToIconName.note,
    },
});

export const ItemsFilter: VFC<ItemsFilterProps> = ({ value, onChange }) => {
    const { anchorRef, isOpen, close, toggle } = usePopperAnchor<HTMLButtonElement>();
    const { matched } = useItems();
    const showCreditCards = useFeatureFlag<boolean>(PassFeature.PassCreditCardsV1);

    const options = useMemo(
        () =>
            Object.entries(getOptionsWithoutCount()).map(([type, { label, icon }]) => ({
                type: type as ItemTypeFilter,
                label,
                icon,
                count: type === '*' ? matched.length : matched.filter((item) => item.data.type === type).length,
            })),
        [matched]
    );

    const selectedOption = options.find(({ type }) => type === value)!;

    return (
        <>
            <DropdownButton
                hasCaret
                className="flex text-sm text-semibold"
                onClick={toggle}
                ref={anchorRef}
                color="weak"
                shape="solid"
                size="small"
                title={c('Action').t`Filter vault items`}
            >
                <Icon name={selectedOption.icon} className="inline mr-2" />
                {`${selectedOption.label} (${selectedOption.count})`}
            </DropdownButton>

            <Dropdown
                anchorRef={anchorRef}
                isOpen={isOpen}
                onClose={close}
                originalPlacement="bottom-start"
                size={DROPDOWN_SIZE}
            >
                <DropdownMenu>
                    {options.map(({ type, count, label, icon }) => {
                        if (type === 'creditCard' && !showCreditCards) return null;

                        return (
                            <DropdownMenuButton
                                key={type}
                                onClick={() => onChange(type)}
                                isSelected={type === value}
                                size="small"
                            >
                                <Icon className="mr-2 color-weak" name={icon} />
                                {label}
                                <span className="color-weak ml-1">({count})</span>
                            </DropdownMenuButton>
                        );
                    })}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
