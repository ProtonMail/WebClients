import type { VFC } from 'react';

import { c } from 'ttag';

import type { DropdownProps } from '@proton/components';
import { Dropdown, DropdownButton, DropdownMenu, Icon, usePopperAnchor } from '@proton/components';
import { type ItemSortFilter } from '@proton/pass/types';

import { DropdownMenuButton } from '../../components/Dropdown/DropdownMenuButton';

interface ItemsSortProps {
    onSortChange: (option: ItemSortFilter) => void;
    sort: ItemSortFilter;
}

function getSortOptionLabel(option: ItemSortFilter) {
    return {
        createTimeASC: c('Label').t`Oldest to newest`,
        createTimeDESC: c('Label').t`Newest to oldest`,
        recent: c('Label').t`Most recent`,
        titleASC: c('Label').t`Alphabetical`,
    }[option];
}

const DROPDOWN_SIZE: DropdownProps['size'] = { width: '11rem' };
const ITEMS_SORT_OPTIONS: ItemSortFilter[] = ['recent', 'titleASC', 'createTimeDESC', 'createTimeASC'];

export const ItemsSort: VFC<ItemsSortProps> = ({ sort, onSortChange }) => {
    const { anchorRef, isOpen, close, toggle } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <DropdownButton
                hasCaret
                onClick={toggle}
                ref={anchorRef}
                color="weak"
                shape="solid"
                size="small"
                title={c('Action').t`Sort vault items`}
            >
                <span className="sr-only">{getSortOptionLabel(sort)}</span>
                <Icon name="arrow-down-arrow-up" className="inline" />
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
                            {getSortOptionLabel(type)}
                        </DropdownMenuButton>
                    ))}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
