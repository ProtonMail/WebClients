import React, { useState, useEffect } from 'react';
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

const DateInput = ({ value, min, max, onChange, displayWeekNumbers, weekStartsOn, ...rest }) => {
    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, open, close } = usePopperAnchor();
    const [temporaryInput, setTemporaryInput] = useState(() => toFormatted(value, dateLocale));

    useEffect(() => {
        setTemporaryInput(toFormatted(value, dateLocale));
    }, [value.getTime()]);

    const handleSelectDate = (newDate) => {
        const newDateTime = +newDate;
        if ((min && +min > newDateTime) || (max && +max < newDateTime)) {
            setTemporaryInput(toFormatted(value, dateLocale));
            return;
        }
        anchorRef.current.blur();
        onChange(newDate);
    };

    const parseAndSetDate = () => {
        try {
            const newDate = fromFormatted(temporaryInput, dateLocale);
            const newDateTime = +newDate;
            if (!isNaN(newDateTime)) {
                return handleSelectDate(newDate);
            }
            // eslint-disable-next-line no-empty
        } catch (e) {}

        setTemporaryInput(toFormatted(value, dateLocale));
    };

    const handleBlur = () => {
        parseAndSetDate();
        close();
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            parseAndSetDate();
            event.preventDefault();
        }
        if (event.key === 'ArrowDown') {
            handleSelectDate(addDays(value, -1));
        }
        if (event.key === 'ArrowUp') {
            handleSelectDate(addDays(value, 1));
        }
    };

    return (
        <>
            <Input
                type="text"
                ref={anchorRef}
                onFocus={open}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                value={temporaryInput}
                onChange={({ target: { value } }) => setTemporaryInput(value)}
                {...rest}
            />
            <Dropdown id={uid} isOpen={isOpen} anchorRef={anchorRef} onClose={close} autoClose={false}>
                <LocalizedMiniCalendar
                    date={value}
                    onSelectDate={handleSelectDate}
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
    min: PropTypes.instanceOf(Date),
    max: PropTypes.instanceOf(Date),
    onChange: PropTypes.func.isRequired
};

export default DateInput;
