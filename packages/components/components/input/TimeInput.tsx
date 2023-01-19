import { ChangeEvent, MouseEvent, useEffect, useMemo, useRef, useState } from 'react';

import { Locale, addMinutes, format, parse, startOfDay } from 'date-fns';
import { c, msgid } from 'ttag';

import { findLongestMatchingIndex } from '@proton/shared/lib/helpers/string';
import { dateLocale } from '@proton/shared/lib/i18n';
import withDecimalPrecision from '@proton/utils/withDecimalPrecision';

import { generateUID } from '../../helpers';
import { useHotkeys } from '../../hooks';
import Dropdown from '../dropdown/Dropdown';
import DropdownMenu from '../dropdown/DropdownMenu';
import DropdownMenuButton from '../dropdown/DropdownMenuButton';
import { usePopperAnchor } from '../popper';
import InputTwo, { InputTwoProps as InputProps } from '../v2/input/Input';

const toFormatted = (value: Date, locale: Locale) => {
    return format(value, 'p', { locale });
};

const fromFormatted = (value: string, locale: Locale) => {
    return parse(value, 'p', new Date(), { locale });
};

const formatDuration = (label: string, minutes: number) => {
    const hours = withDecimalPrecision(minutes / 60, 1);
    const hoursInt = Math.ceil(hours);
    return hours >= 1 ? (
        <>
            <span aria-hidden="true">{
                // translator: 'h' is for hour, please translate with an abbreviated version
                c('Time unit').t`${hours} h`
            }</span>
            <span className="sr-only">{c('Time unit').ngettext(msgid`${hours} hour`, `${hours} hours`, hoursInt)}</span>
        </>
    ) : (
        <>
            <span aria-hidden="true">{
                // translator: 'min' is for minute, please translate with an abbreviated version
                c('Time unit').t`${minutes} min`
            }</span>
            <span className="sr-only">
                {c('Time unit').ngettext(msgid`${minutes} minute`, `${minutes} minutes`, minutes)}
            </span>
        </>
    );
};

const getMinutes = (date: Date) => date.getHours() * 60 + date.getMinutes();

// Get minutes from midnight to prevent having options going further than 11:30 PM (when prevent preventNextDayOverflow prop is active)
const getBaseDateMinutes = (baseDate: Date, interval: number) => {
    const baseMinutes = baseDate.getMinutes();
    let minutes = 0;
    if (baseMinutes > interval) {
        // calculate minutes to remove depending on the interval
        minutes = Math.floor(baseMinutes / interval) * interval;
    }

    return (24 - baseDate.getHours()) * 60 - minutes;
};

const MAX_MINUTES = 24 * 60;

interface Props extends Omit<InputProps, 'onChange' | 'min' | 'max' | 'value'> {
    value: Date;
    min?: Date;
    max?: Date;
    onChange: (date: Date) => void;
    displayDuration?: boolean;
    base?: Date;
    interval?: number;
    preventNextDayOverflow?: boolean; // If we have a min hour, we may want to avoid having calculated options overflowing on the next day
}

const TimeInput = ({
    onChange,
    value,
    interval = 30,
    min,
    displayDuration = false,
    max,
    preventNextDayOverflow = false,
    ...rest
}: Props) => {
    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, open, close } = usePopperAnchor<HTMLInputElement>();
    const [temporaryInput, setTemporaryInput] = useState(() => toFormatted(value, dateLocale));

    useEffect(() => {
        setTemporaryInput(toFormatted(value, dateLocale));
    }, [value]);

    const base = useMemo(() => min || startOfDay(value), [min, value]);

    const minMinutes = getMinutes(base);
    const valueMinutes = getMinutes(value);
    const normalizedMinutes = valueMinutes - minMinutes;

    const handleSelectDate = (newDate: Date) => {
        const newMinutes = getMinutes(newDate);

        if (valueMinutes === newMinutes) {
            return;
        }

        const diffMinutes = newMinutes - minMinutes;

        const normalizedDate = new Date(
            base.getFullYear(),
            base.getMonth(),
            base.getDate(),
            0,
            minMinutes + (diffMinutes < 0 && !preventNextDayOverflow ? diffMinutes + MAX_MINUTES : diffMinutes)
        );

        onChange(normalizedDate);
    };

    const parseAndSetDate = (temporaryInput: string) => {
        try {
            const newDate = fromFormatted(temporaryInput, dateLocale);
            const newDateTime = +newDate;
            if (!Number.isNaN(newDateTime)) {
                handleSelectDate(newDate);
            }
            // eslint-disable-next-line no-empty
        } catch (e: any) {}

        setTemporaryInput(toFormatted(value, dateLocale));
    };

    const handleBlur = () => {
        parseAndSetDate(temporaryInput);
        close();
    };

    useHotkeys(anchorRef, [
        [
            'Escape',
            (e) => {
                if (isOpen) {
                    e.preventDefault();
                    e.stopPropagation();
                    parseAndSetDate(temporaryInput);
                    close();
                }
            },
        ],
        [
            'Enter',
            (e) => {
                parseAndSetDate(temporaryInput);
                if (isOpen) {
                    e.preventDefault();
                    e.stopPropagation();
                    close();
                } else {
                    e.preventDefault();
                    e.stopPropagation();
                    open();
                }
            },
        ],
        [
            'ArrowDown',
            (e) => {
                if (isOpen) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectDate(addMinutes(value, interval));
                }
            },
        ],
        [
            'ArrowUp',
            (e) => {
                if (isOpen) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectDate(addMinutes(value, -1 * interval));
                }
            },
        ],
    ]);

    const scrollRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const options = useMemo(() => {
        const totalMinutes = preventNextDayOverflow ? getBaseDateMinutes(base, interval) : MAX_MINUTES;
        const length = Math.floor(totalMinutes / interval);
        const minutes = Array.from({ length }, (a, i) => i * interval);

        return minutes.map((minutes) => {
            const value = addMinutes(base, minutes);
            const label = toFormatted(value, dateLocale);
            return {
                minutes,
                value,
                label,
                display: displayDuration ? (
                    <>
                        {label} ({formatDuration(label, minutes)})
                    </>
                ) : (
                    label
                ),
            };
        });
    }, [normalizedMinutes, base]);

    const filteredOptions = useMemo(() => {
        return options.filter(({ value }) => {
            const minCondition = min ? value >= min : true;
            const maxCondition = max ? value <= max : true;
            return minCondition && maxCondition;
        });
    }, [options, min, max]);

    const matchingIndex = useMemo(() => {
        const idx = findLongestMatchingIndex(
            filteredOptions.map(({ label }) => label),
            temporaryInput
        );
        return idx === -1 ? undefined : idx;
    }, [filteredOptions, temporaryInput]);

    const scrollToSelection = () => {
        if (!isOpen) {
            return;
        }
        if (!listRef.current || !scrollRef.current || matchingIndex === undefined) {
            return;
        }
        const matchingEl = listRef.current.children[matchingIndex] as HTMLLIElement;
        if (matchingEl) {
            scrollRef.current.scrollTop =
                matchingEl.offsetTop - (scrollRef.current.clientHeight - matchingEl.clientHeight) / 2;
        }
    };

    useEffect(() => {
        // RAF needed due to our portal behavior in dropdown
        requestAnimationFrame(scrollToSelection);
    }, [isOpen]);

    useEffect(() => {
        scrollToSelection();
    }, [matchingIndex]);

    return (
        <>
            <InputTwo
                type="text"
                ref={anchorRef}
                onFocus={() => open()}
                onBlur={handleBlur}
                onClick={() => open()}
                value={temporaryInput}
                onChange={({ target: { value } }: ChangeEvent<HTMLInputElement>) => setTemporaryInput(value)}
                {...rest}
            />
            <Dropdown
                id={uid}
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                disableFocusTrap
                autoClose={false}
                autoCloseOutside={false}
                contentProps={{
                    onMouseDown: (event: MouseEvent<HTMLDivElement>) => {
                        // Prevent default to stop the input getting blurred.
                        event.preventDefault();
                    },
                    ref: scrollRef,
                }}
                disableDefaultArrowNavigation
            >
                <DropdownMenu listRef={listRef}>
                    {filteredOptions.map(({ label, display, value: otherValue }, i) => {
                        // Only highlight if the text includes the input (where 13:05 is centered but not highlighted)
                        const isSelected = i === matchingIndex && label.includes(temporaryInput);
                        return (
                            <DropdownMenuButton
                                key={i}
                                className="text-left text-nowrap"
                                isSelected={isSelected}
                                style={{ pointerEvents: 'auto' }} // Lets the user select the time during typing
                                onClick={() => {
                                    handleSelectDate(otherValue);
                                    close();
                                }}
                            >
                                {display}
                            </DropdownMenuButton>
                        );
                    })}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

export default TimeInput;
