import type { MouseEvent } from 'react';
import { useMemo, useRef, useState } from 'react';

import { getISOWeek } from 'date-fns';
import { c } from 'ttag';

import Tooltip from '@proton/components/components/tooltip/Tooltip';
import clsx from '@proton/utils/clsx';

/*
    ISO weeks always start on Monday, and they won't match user custom weeks starting on Saturday/Sunday.
    A custom week with number N is defined as the one which has the same Monday as ISO week N.
*/

const getWeekNumberToMondayMap = (days: Date[]) => {
    const firstMondayIndex = days.findIndex((day) => day.getDay() === 1);
    const result: { [weekNumber: number]: Date } = {};
    if (firstMondayIndex === -1) {
        return result;
    }
    for (let i = 0; i < Math.floor(days.length / 7); i++) {
        const day = days[firstMondayIndex + 7 * i];
        result[getISOWeek(day)] = day;
    }
    return result;
};

const getTargetMonday = (target: any, weekNumberToMondayMap: { [weekNumber: number]: Date }) => {
    const idx = parseInt(target?.dataset?.i || '', 10);
    if (idx >= 0 && idx <= 53) {
        return weekNumberToMondayMap[idx];
    }
};

const getMonday = (days: Date[], start: number, end: number) => {
    for (let i = start; i < end; ++i) {
        const day = days[i];
        if (day && day.getDay() === 1) {
            return day;
        }
    }
};

export interface Props {
    days: Date[];
    numberOfWeeks: number;
    onClickWeekNumber?: (monday: Date) => void;
    onSelectWeekRange?: (arg: [Date, Date]) => void;
}
const WeekNumbers = ({ days, numberOfWeeks, onClickWeekNumber, onSelectWeekRange }: Props) => {
    const style = {
        '--week-count': numberOfWeeks + 1,
    };
    const weekNumberToMondayMap = useMemo(() => getWeekNumberToMondayMap(days), days);
    const [temporaryWeekRange, setTemporaryWeekRange] = useState<[Date, Date | undefined] | undefined>(undefined);
    const rangeStartRef = useRef<Date | undefined>(undefined);
    const rangeEndRef = useRef<Date | undefined>(undefined);

    const handleMouseDown = ({ target }: MouseEvent<HTMLUListElement>) => {
        const targetMonday = getTargetMonday(target, weekNumberToMondayMap);
        if (rangeStartRef.current || !targetMonday || !onSelectWeekRange) {
            return;
        }

        setTemporaryWeekRange([targetMonday, undefined]);
        rangeStartRef.current = targetMonday;

        const handleMouseUp = () => {
            if (rangeEndRef.current && rangeStartRef.current) {
                onSelectWeekRange(
                    rangeEndRef.current > rangeStartRef.current
                        ? [rangeStartRef.current, rangeEndRef.current]
                        : [rangeEndRef.current, rangeStartRef.current]
                );
            }

            setTemporaryWeekRange(undefined);
            rangeStartRef.current = undefined;
            rangeEndRef.current = undefined;

            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseOver = ({ target }: MouseEvent<HTMLUListElement>) => {
        const targetMonday = getTargetMonday(target, weekNumberToMondayMap);
        if (!rangeStartRef.current || !targetMonday || !onSelectWeekRange) {
            return;
        }
        rangeEndRef.current = targetMonday;

        setTemporaryWeekRange(
            targetMonday > rangeStartRef.current
                ? [rangeStartRef.current, targetMonday]
                : [targetMonday, rangeStartRef.current]
        );
    };

    const handleFocus = () => {};

    const weekNumberLabels = useMemo(() => {
        return Array.from({ length: numberOfWeeks }, (a, i) => {
            const idx = i * 7;
            const monday = getMonday(days, idx, idx + 7) || days[idx];
            const weekNumber = getISOWeek(monday);
            return {
                monday,
                weekNumber,
            };
        });
    }, [days]);

    return (
        <ul
            className={clsx([
                'minicalendar-weeknumbers unstyled m-0 text-center',
                !onSelectWeekRange && '*:pointer-events-none',
            ])}
            style={style}
            onMouseDown={handleMouseDown}
            onMouseOver={handleMouseOver}
            onFocus={handleFocus}
        >
            <li>
                <span className="sr-only">{c('Info').t`Week`}</span>
            </li>
            {weekNumberLabels.map(({ monday, weekNumber }) => {
                const isPressed = !temporaryWeekRange
                    ? false
                    : monday >= temporaryWeekRange[0] && monday <= (temporaryWeekRange[1] || temporaryWeekRange[0]);
                return (
                    <li key={+monday}>
                        <Tooltip title={`${c('Info').t`Week`} ${weekNumber}`} originalPlacement="bottom">
                            <button
                                data-i={weekNumber}
                                aria-pressed={isPressed}
                                type="button"
                                className={clsx([
                                    'minicalendar-weeknumber',
                                    !onClickWeekNumber && 'pointer-events-none',
                                ])}
                                onClick={() => onClickWeekNumber?.(monday)}
                            >
                                <span className="pointer-events-none">{weekNumber}</span>
                            </button>
                        </Tooltip>
                    </li>
                );
            })}
        </ul>
    );
};

export default WeekNumbers;
