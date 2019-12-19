import React, { useEffect, useState, useMemo, useRef } from 'react';
import { c, msgid } from 'ttag';
import PropTypes from 'prop-types';
import { addMinutes, startOfDay, format, parse } from 'date-fns';
import { dateLocale } from 'proton-shared/lib/i18n';
import { findLongestMatchingIndex } from 'proton-shared/lib/helpers/string';

import Input from './Input';
import Dropdown from '../dropdown/Dropdown';
import { usePopperAnchor } from '../popper';
import { classnames, generateUID } from '../../helpers/component';

const toFormatted = (value, locale) => {
    return format(value, 'p', { locale });
};

const fromFormatted = (value, locale) => {
    return parse(value, 'p', new Date(), { locale });
};

const formatDuration = (label, minutes) => {
    const hours = (minutes / 60).toFixed(1);
    const hoursInt = Math.ceil(hours);
    return hours >= 1
        ? c('Time unit').ngettext(msgid`${hours} hour`, `${hours} hours`, hoursInt)
        : c('Time unit').ngettext(msgid`${minutes} minutes`, `${minutes} minutes`, minutes);
};

const getMinutes = (date) => date.getHours() * 60 + date.getMinutes();

const MAX_MINUTES = 24 * 60;

const TimeInput = ({ onChange, value, interval = 30, min, displayDuration = false, max, ...rest }) => {
    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, open, close } = usePopperAnchor();
    const [temporaryInput, setTemporaryInput] = useState(() => toFormatted(value, dateLocale));

    useEffect(() => {
        setTemporaryInput(toFormatted(value, dateLocale));
    }, [value]);

    const base = useMemo(() => min || startOfDay(value), [min, value]);

    const minMinutes = getMinutes(base);
    const valueMinutes = getMinutes(value);
    const normalizedMinutes = valueMinutes - minMinutes;

    const handleSelectDate = (newDate) => {
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

    const parseAndSetDate = () => {
        try {
            const newDate = fromFormatted(temporaryInput, dateLocale);
            const newDateTime = +newDate;
            if (!isNaN(newDateTime)) {
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

    const handleKeyDown = (event) => {
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

    const scrollRef = useRef();
    const listRef = useRef();
    const options = useMemo(() => {
        const length = Math.floor(MAX_MINUTES / interval);
        const minutes = Array.from({ length }, (a, i) => i * interval);

        return minutes.map((minutes) => {
            const value = addMinutes(base, minutes);
            const label = toFormatted(value, dateLocale);
            return {
                minutes,
                value,
                label: displayDuration ? `${label} (${formatDuration(label, minutes)})` : label
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

    useEffect(() => {
        if (!isOpen) {
            return;
        }
        const matchingEl = listRef.current.children[matchingIndex];
        if (matchingEl) {
            scrollRef.current.scrollTop =
                matchingEl.offsetTop - (scrollRef.current.clientHeight - matchingEl.clientHeight) / 2;
        }
    }, [matchingIndex, isOpen]);

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
                onChange={({ target: { value } }) => setTemporaryInput(value)}
                {...rest}
            />
            <Dropdown
                size={displayDuration ? 'normal' : 'narrow'}
                id={uid}
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                autoClose={false}
            >
                <div className="dropDown-content" onMouseDown={(e) => e.preventDefault()} ref={scrollRef}>
                    <ul className="unstyled mt0 mb0" ref={listRef}>
                        {filteredOptions.map(({ label, value: otherValue }, i) => {
                            // Only highlight if the text includes the input (where 13:05 is centered but not highlighted)
                            const isSelected = i === matchingIndex && label.includes(temporaryInput);
                            return (
                                <li key={i}>
                                    <button
                                        className={classnames(['w100 pt0-5 pb0-5 p1', isSelected && 'bold'])}
                                        onClick={() => {
                                            handleSelectDate(otherValue);
                                            close();
                                        }}
                                    >
                                        {label}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </Dropdown>
        </>
    );
};

TimeInput.propTypes = {
    value: PropTypes.instanceOf(Date).isRequired,
    displayDuration: PropTypes.bool,
    base: PropTypes.instanceOf(Date),
    min: PropTypes.instanceOf(Date),
    max: PropTypes.instanceOf(Date),
    onChange: PropTypes.func.isRequired,
    interval: PropTypes.number
};

export default TimeInput;
