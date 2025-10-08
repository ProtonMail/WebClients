import { memo } from 'react';

import { c } from 'ttag';

import type { DropdownProps } from '@proton/components/components/dropdown/Dropdown';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import type { IconName } from '@proton/components/components/icon/Icon';
import Icon from '@proton/components/components/icon/Icon';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import type { ItemSortFilter } from '@proton/pass/types';

type Props = {
    value: ItemSortFilter;
    onChange: (value: ItemSortFilter) => void;
};

const getSortOptionDetails = (option: ItemSortFilter) => {
    const options: Record<string, { label: string; shortLabel: string; icon: IconName }> = {
        createTimeASC: {
            // translator: this is sorting filter label from drop down menu
            label: c('Label').t`Oldest to newest`,
            // translator: this is short filter label for "Oldest to newest" (when filter is selected)
            shortLabel: c('Label').t`Old-New`,
            icon: 'arrow-down-arrow-up',
        },
        createTimeDESC: {
            // translator: this is sorting filter label from drop down menu
            label: c('Label').t`Newest to oldest`,
            // translator: this is short filter label for "Newest to oldest" (when filter is selected)
            shortLabel: c('Label').t`New-Old`,
            icon: 'arrow-down-arrow-up',
        },
        recent: {
            // translator: this is sorting filter label from drop down menu (Recent means items that have been recently used or updated ordered by time (today, last week, last 2 weeks, last month...))
            label: c('Label').t`Most recent`,
            // translator: this is short filter label for "Most recent" (when filter is selected)
            shortLabel: c('Label').t`Recent`,
            icon: 'clock',
        },
        titleASC: {
            // translator: this is sorting filter label from drop down menu
            label: c('Label').t`Alphabetical`,
            // translator: this is short filter label for "Alphabetical" (when filter is selected)
            shortLabel: c('Label').t`A-Z`,
            icon: 'arrow-down-arrow-up',
        },
    };

    return options[option];
};

const DROPDOWN_SIZE: DropdownProps['size'] = { width: '13rem' };
const ITEMS_SORT_OPTIONS: ItemSortFilter[] = ['recent', 'titleASC', 'createTimeDESC', 'createTimeASC'];

export const SortFilter = memo(({ value, onChange }: Props) => {
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
                className="flex flex-nowrap gap-2 grow-0 text-sm text-semibold"
            >
                <span className="sr-only">{getSortOptionDetails(value).label}</span>
                <Icon name={getSortOptionDetails(value).icon as IconName} className="shrink-0" />
                <span className="text-ellipsis hidden sm:block">{getSortOptionDetails(value).shortLabel}</span>
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
                    {ITEMS_SORT_OPTIONS.map((type) => {
                        const { label, icon } = getSortOptionDetails(type);
                        return (
                            <DropdownMenuButton
                                key={type}
                                onClick={() => onChange(type)}
                                isSelected={value === type}
                                size="small"
                                label={label}
                                icon={icon}
                                ellipsis={false}
                            />
                        );
                    })}
                </DropdownMenu>
            </Dropdown>
        </>
    );
});

SortFilter.displayName = 'SortFilterMemo';
