import React, { useEffect, useState, useMemo, useRef, ChangeEvent } from 'react';
import { c, msgid } from 'ttag';
import { Locale, addMinutes, startOfDay, format, parse } from 'date-fns';
import { dateLocale } from 'proton-shared/lib/i18n';
import { findLongestMatchingIndex } from 'proton-shared/lib/helpers/string';
import { withDecimalPrecision } from 'proton-shared/lib/helpers/math';

import Input, { Props as InputProps } from './Input';
import Dropdown from '../dropdown/Dropdown';
import { usePopperAnchor } from '../popper';
import { generateUID } from '../../helpers';
import DropdownMenu from '../dropdown/DropdownMenu';
import DropdownMenuButton from '../dropdown/DropdownMenuButton';

const toFormatted = (value: Date, locale: Locale) => {
    return format(value, 'p', { locale });
};

const fromFormatted = (value: string, locale: Locale) => {
    return parse(value, 'p', new Date(), { locale });
};

const formatDuration = (label: string, minutes: number) => {
    const hours = withDecimalPrecision(minutes / 60, 1);
    const hoursInt = Math.ceil(hours);
    return hours >= 1
        ? c('Time unit').ngettext(msgid`${hours} hour`, `${hours} hours`, hoursInt)
        : c('Time unit').ngettext(msgid`${minutes} minute`, `${minutes} minutes`, minutes);
};

const getMinutes = (date: Date) => date.getHours() * 60 + date.getMinutes();

const MAX_MINUTES = 24 * 60;

interface Props extends Omit<InputProps, 'onChange' | 'min' | 'max' | 'value'> {
    value: Date;
    min?: Date;
    max?: Date;
    onChange: (date: Date) => void;
    displayDuration?: boolean;
    base?: Date;
    interval?: number;
}

const TimeInput = ({ onChange, value, interval = 30, min, displayDuration = false, max, ...rest }: Props) => {
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
            minMinutes + (diffMinutes < 0 ? diffMinutes + MAX_MINUTES : diffMinutes)
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
        } catch (e) {}

        setTemporaryInput(toFormatted(value, dateLocale));
    };

    const handleBlur = () => {
        parseAndSetDate(temporaryInput);
        close();
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        const { key } = event;
        if (key === 'Enter') {
            parseAndSetDate(temporaryInput);
            event.preventDefault();
            return close();
        }

        if (key === 'ArrowDown') {
            handleSelectDate(addMinutes(value, interval));
        }

        if (key === 'ArrowUp') {
            handleSelectDate(addMinutes(value, -1 * interval));
        }
    };

    const scrollRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const options = useMemo(() => {
        const length = Math.floor(MAX_MINUTES / interval);
        const minutes = Array.from({ length }, (a, i) => i * interval);

        return minutes.map((minutes) => {
            const value = addMinutes(base, minutes);
            const label = toFormatted(value, dateLocale);
            return {
                minutes,
                value,
                label: displayDuration ? `${label} (${formatDuration(label, minutes)})` : label,
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
            <Input
                type="text"
                ref={anchorRef}
                onFocus={() => open()}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
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
                    onMouseDown: (event: React.MouseEvent<HTMLDivElement>) => {
                        // Prevent default to stop the input getting blurred.
                        event.preventDefault();
                    },
                    ref: scrollRef,
                }}
            >
                <DropdownMenu listRef={listRef}>
                    {filteredOptions.map(({ label, value: otherValue }, i) => {
                        // Only highlight if the text includes the input (where 13:05 is centered but not highlighted)
                        const isSelected = i === matchingIndex && label.includes(temporaryInput);
                        return (
                            <DropdownMenuButton
                                key={i}
                                isSelected={isSelected}
                                style={{ pointerEvents: 'auto' }} // Lets the user select the time during typing
                                onClick={() => {
                                    handleSelectDate(otherValue);
                                    close();
                                }}
                            >
                                {label}
                            </DropdownMenuButton>
                        );
                    })}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

export default TimeInput;
