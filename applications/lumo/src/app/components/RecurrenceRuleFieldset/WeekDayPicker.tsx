import { useId, useMemo } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { getFormattedWeekdays } from '@proton/shared/lib/date/date';
import { dateLocale } from '@proton/shared/lib/i18n';
import { getWeekStartsOn } from '@proton/shared/lib/settings/helper';

import { FieldError } from './FieldError';
import type { WeekdayToken } from './types';
import { WEEKDAY_TOKENS_BY_CALENDAR_INDEX, getWeekdayTokensInDisplayOrder } from './utils';

import './WeekDayPicker.scss';

interface WeekDayPickerProps {
    days: WeekdayToken[];
    error?: string;
    onChange: (days: WeekdayToken[]) => void;
}

/**
 * WeekDayPicker component displays a list of buttons for selecting the days of the week.
 */
export const WeekDayPicker = ({ days, error, onChange }: WeekDayPickerProps) => {
    const errorId = useId();
    const [userSettings] = useUserSettings();

    const options = useMemo(() => {
        const weekStartsOn = getWeekStartsOn(userSettings);
        const weekdaysLong = getFormattedWeekdays('cccc', { locale: dateLocale });
        const weekdaysNarrow = getFormattedWeekdays('ccccc', { locale: dateLocale });

        return getWeekdayTokensInDisplayOrder(weekStartsOn).map((day) => {
            const index = WEEKDAY_TOKENS_BY_CALENDAR_INDEX.indexOf(day);

            return {
                day,
                displayLabel: weekdaysNarrow[index],
                ariaLabel: weekdaysLong[index],
            };
        });
    }, [userSettings]);

    const selectedDays = new Set(days);

    const onDayClick = (day: WeekdayToken) => {
        if (selectedDays.has(day)) {
            selectedDays.delete(day);
        } else {
            selectedDays.add(day);
        }
        onChange([...selectedDays]);
    };

    return (
        <div className="flex flex-column">
            <div
                aria-describedby={error ? errorId : undefined}
                aria-label={
                    // translator: Accessible label for the button group that allows users to select the days of the week.
                    c('collider_2025:Label').t`Days of week`
                }
                className="week-day-picker flex gap-1.5"
            >
                {options.map(({ day, displayLabel, ariaLabel }) => {
                    const isSelected = selectedDays.has(day);
                    return (
                        <Button
                            aria-label={ariaLabel}
                            aria-pressed={isSelected}
                            className={clsx([
                                'week-day-picker__day items-center justify-center p-0 rounded-full',
                                error && 'border-danger',
                            ])}
                            color={isSelected ? 'norm' : 'weak'}
                            key={day}
                            onClick={() => onDayClick(day)}
                            type="button"
                        >
                            {displayLabel}
                        </Button>
                    );
                })}
            </div>
            {error && <FieldError id={errorId} message={error} />}
        </div>
    );
};
