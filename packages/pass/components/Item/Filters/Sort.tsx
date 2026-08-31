import { type KeyboardEvent, type MouseEvent, memo } from 'react';

import { c } from 'ttag';

import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import type { DropdownProps } from '@proton/components/components/dropdown/Dropdown';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import type { IconName } from '@proton/icons/types';
import clsx from '@proton/utils/clsx';

import { useFeatureFlag } from '../../../hooks/useFeatureFlag';
import { intoDisplayedSortFilter } from '../../../lib/items/item.utils';
import type { ItemSortFilter } from '../../../types';
import { PassFeature } from '../../../types/api/features';
import { DropdownMenuButton } from '../../Layout/Dropdown/DropdownMenuButton';
import { FilterClearButton } from './FilterClearButton';

import './FilterClearButton.scss';

type Props = {
    value: ItemSortFilter;
    hasSearch: boolean;
    onChange: (value: ItemSortFilter) => void;
};

const getSortOptionDetails = (option: ItemSortFilter) => {
    const options: Record<string, { label: string; shortLabel: string; icon: IconName }> = {
        relevant: {
            // translator: this is sorting filter label from drop down menu (Relevant means search results are ordered by how well they match the search term)
            label: c('Label').t`Relevant`,
            // translator: this is short filter label for "Relevant" (when filter is selected)
            shortLabel: c('Label').t`Relevant`,
            icon: 'magnifier',
        },
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

    /* `option` comes from persisted filters (URL, cache) and may hold a value this build
    doesn't know, e.g. after a version rollback. We fallback to `recent` to be safe. */
    return options[option] ?? options.recent;
};

const DROPDOWN_SIZE: DropdownProps['size'] = { width: '13rem' };
const ITEMS_SORT_OPTIONS: ItemSortFilter[] = ['relevant', 'recent', 'titleASC', 'createTimeDESC', 'createTimeASC'];

export const SortFilter = memo(({ value, hasSearch, onChange }: Props) => {
    const { anchorRef, isOpen, close, toggle } = usePopperAnchor<HTMLButtonElement>();
    const showRelevantSort = useFeatureFlag(PassFeature.PassWeb__V1_41__RelevantSort);

    const displayValue = intoDisplayedSortFilter(value, hasSearch);
    const isActive = displayValue !== 'recent';
    const { label, shortLabel } = getSortOptionDetails(displayValue);
    const options = ITEMS_SORT_OPTIONS.filter((type) => type !== 'relevant' || (hasSearch && showRelevantSort));

    const handleClear = (event: MouseEvent | KeyboardEvent) => {
        event.stopPropagation();
        onChange('recent');
    };

    return (
        <>
            <div className={clsx('pass-type-filter', isActive && 'pass-type-filter--active')}>
                <DropdownButton
                    onClick={toggle}
                    ref={anchorRef}
                    color={isActive ? 'norm' : 'weak'}
                    shape={isActive ? undefined : 'solid'}
                    size="small"
                    title={label}
                    className={clsx(
                        'flex flex-nowrap gap-1.5 min-w-0 max-w-full text-sm text-semibold',
                        isActive && 'pass-type-filter-trigger'
                    )}
                >
                    <span className="sr-only">{label}</span>
                    <span className="pass-type-filter-label">{shortLabel}</span>
                </DropdownButton>
                {isActive && <FilterClearButton onClear={handleClear} title={c('Action').t`Clear sort filter`} />}
            </div>

            <Dropdown
                anchorRef={anchorRef}
                isOpen={isOpen}
                onClose={close}
                offset={5}
                originalPlacement="bottom-start"
                size={DROPDOWN_SIZE}
            >
                <DropdownMenu>
                    {options.map((type) => {
                        const { label, icon } = getSortOptionDetails(type);
                        return (
                            <Tooltip
                                key={type}
                                originalPlacement="right"
                                title={
                                    type === 'relevant'
                                        ? // translator: tooltip explaining how the "Relevant" sorting works
                                          c('Info')
                                              .t`Ranked by field (title first, then username or email, website, notes) and match precision (exact, starts with, contains).`
                                        : undefined
                                }
                            >
                                <DropdownMenuButton
                                    onClick={() => onChange(type)}
                                    isSelected={displayValue === type}
                                    size="small"
                                    label={label}
                                    icon={icon}
                                    ellipsis={false}
                                />
                            </Tooltip>
                        );
                    })}
                </DropdownMenu>
            </Dropdown>
        </>
    );
});

SortFilter.displayName = 'SortFilterMemo';
