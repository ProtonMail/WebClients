import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import type { AllChatsFilterValue } from '../filterAllChatsConversations';
import { getAllChatsFilterOptions } from './allChatsHeaderOptions';

import '../AllChatsButtons.scss';

interface Props {
    filter: AllChatsFilterValue;
    onFilterChange: (value: AllChatsFilterValue) => void;
    excludedFilters?: AllChatsFilterValue[];
    className?: string;
}

/**
 * Filter chips. They fit beside Sort and Select at phone width (Select is icon-only there); a
 * long translation wraps them onto a second line rather than scrolling them sideways, because
 * Chrome can drop the first mouse click after a wheel scroll inside a horizontal scroller.
 */
export const AllChatsFilterChips = ({ filter, onFilterChange, excludedFilters = [], className }: Props) => {
    const options = getAllChatsFilterOptions().filter((option) => {
        return !excludedFilters.includes(option.value);
    });

    return (
        <fieldset
            className={clsx('all-chats-filter-chips flex flex-wrap gap-2 border-none p-0 m-0 min-w-0', className)}
        >
            <legend className="sr-only">{c('collider_2025:Label').t`Filter chats`}</legend>
            {options.map((option) => {
                const isActive = option.value === filter;

                return (
                    <Button
                        key={option.value}
                        shape="outline"
                        color="weak"
                        size="small"
                        pill
                        className={clsx(
                            'all-chats-filter-chip shrink-0 flex flex-nowrap items-center gap-1 font-medium',
                            isActive && 'is-active'
                        )}
                        aria-pressed={isActive}
                        onClick={() => {
                            onFilterChange(option.value);
                        }}
                    >
                        {isActive ? <LumoIcon name="Check" size={16} className="shrink-0" /> : null}
                        {option.label}
                    </Button>
                );
            })}
        </fieldset>
    );
};
