import React, { useEffect, useState, useMemo, useRef } from 'react';
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

const TimeInput = ({ onChange, value, interval = 30, ...rest }) => {
    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, open, close } = usePopperAnchor();
    const [temporaryInput, setTemporaryInput] = useState(() => toFormatted(value, dateLocale));

    useEffect(() => {
        setTemporaryInput(toFormatted(value, dateLocale));
    }, [value]);

    const handleSelectDate = (newDate) => {
        onChange(newDate);
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
        const multiplier = (24 * 60) / interval;
        const base = startOfDay(value);
        return Array.from({ length: multiplier }, (a, i) => {
            const value = addMinutes(base, i * interval);
            return {
                value,
                label: format(value, 'p', { locale: dateLocale })
            };
        });
    }, []);

    const matchingIndex = useMemo(() => {
        const idx = findLongestMatchingIndex(options.map(({ label }) => label), temporaryInput);
        return idx === -1 ? undefined : idx;
    }, [options, temporaryInput]);

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
            <Dropdown size="narrow" id={uid} isOpen={isOpen} anchorRef={anchorRef} onClose={close} autoClose={false}>
                <div className="dropDown-content" onMouseDown={(e) => e.preventDefault()} ref={scrollRef}>
                    <ul className="unstyled mt0 mb0" ref={listRef}>
                        {options.map(({ label, value: otherValue }, i) => {
                            const isSelected = label === temporaryInput;
                            return (
                                <li className={classnames(['pt0-5 pb0-5 p1', isSelected && 'bold'])} key={i}>
                                    <button
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
    onChange: PropTypes.func.isRequired,
    interval: PropTypes.number
};

export default TimeInput;
