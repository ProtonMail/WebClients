import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { format, parse, addDays } from 'date-fns';
import { dateLocale } from 'proton-shared/lib/i18n';

import Input from './Input';
import { usePopperAnchor } from '../popper';
import Dropdown from '../dropdown/Dropdown';
import { generateUID } from '../../helpers/component';
import LocalizedMiniCalendar from '../miniCalendar/LocalizedMiniCalendar';

const toFormatted = (value, locale) => {
    return format(value, 'PP', { locale });
};

const fromFormatted = (value, locale) => {
    return parse(value, 'PP', new Date(), { locale });
};

const DateInput = ({ value, onChange, displayWeekNumbers, weekStartsOn, ...rest }) => {
    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, open, close } = usePopperAnchor();

    const [temporaryInput, setTemporaryInput] = useState('');
    const [showTemporary, setShowTemporary] = useState(false);

    useEffect(() => {
        setTemporaryInput(toFormatted(value, dateLocale));
    }, [+value]);

    const currentInput = useMemo(() => toFormatted(value, dateLocale), [value]);

    const temporaryValue = useMemo(() => {
        if (!temporaryInput) {
            return;
        }
        try {
            const newDate = fromFormatted(temporaryInput, dateLocale);
            if (newDate.getFullYear() < 1900 || newDate.getFullYear() > 2200) {
                return;
            }
            if (isNaN(+newDate)) {
                return;
            }
            return newDate;
            // eslint-disable-next-line no-empty
        } catch (e) {}
    }, [temporaryInput]);

    const actualValue = temporaryValue || value;

    const parseAndTriggerChange = () => {
        // Before the new date is set, the input is reset to the old date in case the onChange handler rejects the change,
        // or it's an invalid date that couldn't be parsed
        setTemporaryInput(toFormatted(value, dateLocale));
        if (temporaryValue) {
            onChange(temporaryValue);
        }
    };

    const handleFocusInput = () => {
        open();

        setShowTemporary(true);
        setTemporaryInput(currentInput);
    };

    const handleBlurInput = () => {
        parseAndTriggerChange();
        close();

        setShowTemporary(false);
        setTemporaryInput('');
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            parseAndTriggerChange();
            event.preventDefault();
        }
        if (event.key === 'ArrowDown') {
            setTemporaryInput(toFormatted(addDays(actualValue, -1), dateLocale));
        }
        if (event.key === 'ArrowUp') {
            setTemporaryInput(toFormatted(addDays(actualValue, 1), dateLocale));
        }
    };

    const handleClickDate = (newDate) => {
        setTemporaryInput(toFormatted(newDate, dateLocale));
        setTimeout(() => anchorRef.current && anchorRef.current.blur());
    };

    const handleInputChange = ({ target: { value } }) => {
        setTemporaryInput(value);
    };

    return (
        <>
            <Input
                type="text"
                ref={anchorRef}
                onFocus={handleFocusInput}
                onBlur={handleBlurInput}
                onKeyDown={handleKeyDown}
                value={showTemporary ? temporaryInput : currentInput}
                onChange={handleInputChange}
                {...rest}
            />
            <Dropdown id={uid} isOpen={isOpen} anchorRef={anchorRef} onClose={close} autoClose={false}>
                <LocalizedMiniCalendar
                    date={actualValue}
                    onSelectDate={handleClickDate}
                    displayWeekNumbers={displayWeekNumbers}
                    weekStartsOn={weekStartsOn}
                />
            </Dropdown>
        </>
    );
};

DateInput.propTypes = {
    id: PropTypes.string,
    disabled: PropTypes.bool,
    required: PropTypes.bool,
    className: PropTypes.string,
    displayWeekNumbers: PropTypes.bool,
    weekStartsOn: PropTypes.number,
    value: PropTypes.instanceOf(Date).isRequired,
    onChange: PropTypes.func.isRequired
};

export default DateInput;
