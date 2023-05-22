import type { VFC } from 'react';

import { c } from 'ttag';

import type { DropdownProps } from '@proton/components';
import { Dropdown, DropdownButton, DropdownMenu, Icon, usePopperAnchor } from '@proton/components';
import { ITEMS_SORT_OPTIONS, type ItemsSortOption } from '@proton/pass/types';

import { DropdownMenuButton } from '../../components/Dropdown/DropdownMenuButton';

interface ItemsSortProps {
    onSortChange: (option: ItemsSortOption) => void;
    sort: ItemsSortOption;
}

function getSortOptionLabel(option: ItemsSortOption) {
    return {
        createTimeASC: c('Label').t`Oldest to newest`,
        createTimeDESC: c('Label').t`Newest to oldest`,
        recent: c('Label').t`Most recent`,
        titleASC: c('Label').t`Alphabetical`,
    }[option];
}

const DROPDOWN_SIZE: DropdownProps['size'] = { width: '11rem' };

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
