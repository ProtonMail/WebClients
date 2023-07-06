import type { VFC } from 'react';

import { c } from 'ttag';

import type { DropdownProps, IconName } from '@proton/components';
import { Dropdown, DropdownButton, DropdownMenu, Icon, usePopperAnchor } from '@proton/components';
import { type ItemSortFilter } from '@proton/pass/types';

import { DropdownMenuButton } from '../../components/Dropdown/DropdownMenuButton';

interface ItemsSortProps {
    onSortChange: (option: ItemSortFilter) => void;
    sort: ItemSortFilter;
}

function getSortOptionDetails(option: ItemSortFilter) {
    return {
        createTimeASC: {
            label: c('Label').t`Oldest to newest`,
            shortLabel: c('Label').t`Old-New`,
            icon: 'arrow-down-arrow-up',
        },
        createTimeDESC: {
            label: c('Label').t`Newest to oldest`,
            shortLabel: c('Label').t`New-Old`,
            icon: 'arrow-down-arrow-up',
        },
        recent: { label: c('Label').t`Most recent`, shortLabel: c('Label').t`Recent`, icon: 'clock' },
        titleASC: { label: c('Label').t`Alphabetical`, shortLabel: c('Label').t`A-Z`, icon: 'arrow-down-arrow-up' },
    }[option];
}

const DROPDOWN_SIZE: DropdownProps['size'] = { width: '11rem' };
const ITEMS_SORT_OPTIONS: ItemSortFilter[] = ['recent', 'titleASC', 'createTimeDESC', 'createTimeASC'];

export const ItemsSort: VFC<ItemsSortProps> = ({ sort, onSortChange }) => {
    const { anchorRef, isOpen, close, toggle } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <DropdownButton
                onClick={toggle}
                ref={anchorRef}
                color="weak"
                shape="solid"
                size="small"
                title={c('Action').t`Sort vault items`}
                className="text-sm text-semibold flex-item-fluid-auto flex-item-nogrow flex-item-noshrink"
            >
                <span className="sr-only">{getSortOptionDetails(sort).label}</span>
                <Icon name={getSortOptionDetails(sort).icon as IconName} className="inline mr-2" />
                {getSortOptionDetails(sort).shortLabel}
            </DropdownButton>

            <Dropdown
                anchorRef={anchorRef}
                isOpen={isOpen}
                onClose={close}
                offset={5}
                originalPlacement="bottom-start"
                size={DROPDOWN_SIZE}
            >
                <DropdownMenu>
                    {ITEMS_SORT_OPTIONS.map((type) => (
                        <DropdownMenuButton
                            key={type}
                            onClick={() => onSortChange(type)}
                            isSelected={sort === type}
                            size="small"
                        >
                            {getSortOptionDetails(type).label}
                        </DropdownMenuButton>
                    ))}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
