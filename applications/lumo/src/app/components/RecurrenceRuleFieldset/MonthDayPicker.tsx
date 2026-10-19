import { useId, useMemo } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import { batchItems } from '../../util/batchItems';
import { FieldError } from './FieldError';

import './MonthDayPicker.scss';

const DAYS_PER_ROW = 10;

interface MonthDayPickerProps {
    days: number[];
    error?: string;
    onChange: (days: number[]) => void;
}

/**
 * MonthDayPicker displays buttons for selecting days of the month.
 */
export const MonthDayPicker = ({ days, error, onChange }: MonthDayPickerProps) => {
    const errorId = useId();
    const optionRows = useMemo(() => {
        const options = Array.from({ length: 31 }, (_, index) => index + 1).map((day) => ({
            day,
            displayLabel: String(day),
            // translator: Accessibility label for a day-of-month button. ${day} is 1–31.
            ariaLabel: c('collider_2025:Option').t`Day ${day}`,
        }));
        return batchItems(options, DAYS_PER_ROW);
    }, []);

    const selectedDays = new Set(days);

    const onDayClick = (day: number) => {
        if (selectedDays.has(day)) {
            selectedDays.delete(day);
        } else {
            selectedDays.add(day);
        }
        const newSelectedDays = [...selectedDays];
        newSelectedDays.sort((a, b) => a - b);
        onChange(newSelectedDays);
    };

    return (
        <div className="flex flex-column">
            <div
                aria-colcount={DAYS_PER_ROW}
                aria-describedby={error ? errorId : undefined}
                aria-label={
                    // translator: Accessible label for the grid that allows users to select days of the month.
                    c('collider_2025:Label').t`Days of month`
                }
                aria-rowcount={optionRows.length}
                className="month-day-picker flex flex-column gap-1.5"
                role="grid"
            >
                {optionRows.map((row, rowIndex) => (
                    // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
                    <div
                        aria-rowindex={rowIndex + 1}
                        className="flex flex-nowrap gap-1.5 w-full"
                        key={rowIndex}
                        role="row"
                    >
                        {Array.from({ length: DAYS_PER_ROW }, (_, columnIndex) => {
                            const option = row[columnIndex];

                            return (
                                // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
                                <div
                                    aria-colindex={columnIndex + 1}
                                    className="flex-1 min-w-0"
                                    key={option?.day ?? columnIndex}
                                    role={option ? 'gridcell' : undefined}
                                >
                                    {option && (
                                        <Button
                                            aria-label={option.ariaLabel}
                                            aria-pressed={selectedDays.has(option.day)}
                                            className={clsx([
                                                'month-day-picker__day items-center justify-center mx-auto p-0 rounded-full',
                                                error && 'border-danger',
                                            ])}
                                            color={selectedDays.has(option.day) ? 'norm' : 'weak'}
                                            onClick={() => onDayClick(option.day)}
                                            type="button"
                                        >
                                            {option.displayLabel}
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
            {error && <FieldError id={errorId} message={error} />}
        </div>
    );
};
