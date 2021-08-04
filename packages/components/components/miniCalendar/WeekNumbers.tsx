import { useMemo, useRef, useState } from 'react';
import * as React from 'react';
import { c } from 'ttag';
import { getISOWeek } from 'date-fns';
import { classnames } from '../../helpers';
import { Tooltip } from '../tooltip';

const getTargetWeek = (target: any) => {
    const idx = parseInt(target?.dataset?.i || '', 10);
    if (idx >= 0 && idx <= 53) {
        return idx;
    }
};

export interface Props {
    days: Date[];
    numberOfWeeks: number;
    onClickWeekNumber?: (weekNumber: number) => void;
    onSelectWeekRange?: (arg: [number, number]) => void;
}

const getMonday = (days: Date[], start: number, end: number) => {
    for (let i = start; i < end; ++i) {
        const day = days[i];
        if (day && day.getDay() === 1) {
            return day;
        }
    }
};

const WeekNumbers = ({ days, numberOfWeeks, onClickWeekNumber, onSelectWeekRange }: Props) => {
    const style = {
        '--week-count': numberOfWeeks + 1,
    };
    const [temporaryWeekRange, setTemporaryWeekRange] = useState<[number, number | undefined] | undefined>(undefined);
    const rangeStartRef = useRef<number | undefined>(undefined);
    const rangeEndRef = useRef<number | undefined>(undefined);

    const handleMouseDown = ({ target }: React.MouseEvent<HTMLUListElement>) => {
        const targetWeek = getTargetWeek(target);
        if (rangeStartRef.current || !targetWeek || !onSelectWeekRange) {
            return;
        }

        setTemporaryWeekRange([targetWeek, undefined]);
        rangeStartRef.current = targetWeek;

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

    const handleMouseOver = ({ target }: React.MouseEvent<HTMLUListElement>) => {
        const targetWeek = getTargetWeek(target);
        if (!rangeStartRef.current || !targetWeek || !onSelectWeekRange) {
            return;
        }
        rangeEndRef.current = targetWeek;

        setTemporaryWeekRange(
            targetWeek > rangeStartRef.current
                ? [rangeStartRef.current, targetWeek]
                : [targetWeek, rangeStartRef.current]
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
            className={classnames([
                'minicalendar-weeknumbers unstyled m0 text-center',
                !onSelectWeekRange && 'no-pointer-events-children',
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
                    : weekNumber >= temporaryWeekRange[0] &&
                      weekNumber <= (temporaryWeekRange[1] || temporaryWeekRange[0]);
                return (
                    <li key={+monday}>
                        <Tooltip title={`${c('Info').t`Week`} ${weekNumber}`} originalPlacement="bottom">
                            <button
                                data-i={weekNumber}
                                aria-pressed={isPressed}
                                type="button"
                                className={classnames([
                                    'minicalendar-weeknumber',
                                    !onClickWeekNumber && 'no-pointer-events',
                                ])}
                                onClick={() => onClickWeekNumber?.(weekNumber)}
                            >
                                <span className="no-pointer-events">{weekNumber}</span>
                            </button>
                        </Tooltip>
                    </li>
                );
            })}
        </ul>
    );
};

export default WeekNumbers;
