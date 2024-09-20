import type { ChangeEvent, FocusEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

import type { Locale } from 'date-fns';
import { addDays, format, parse } from 'date-fns';
import { c } from 'ttag';

import Dropdown from '@proton/components/components/dropdown/Dropdown';
import LocalizedMiniCalendar from '@proton/components/components/miniCalendar/LocalizedMiniCalendar';
import { dateLocale } from '@proton/shared/lib/i18n';
import generateUID from '@proton/utils/generateUID';

import { useHotkeys } from '../../hooks';
import { usePopperAnchor } from '../popper';
import type { Props as InputProps } from './Input';
import Input from './Input';

const toFormatted = (value: Date, locale: Locale) => {
    return format(value, 'PP', { locale });
};

const fromFormatted = (value: string, locale: Locale) => {
    return parse(value, 'PP', new Date(), { locale });
};

const getTemporaryInputFromValue = (value: Date | undefined) => {
    return value ? toFormatted(value, dateLocale) : '';
};

const DEFAULT_MIN = new Date(1900, 0, 1);
const DEFAULT_MAX = new Date(2200, 0, 1);

interface Props extends Omit<InputProps, 'min' | 'max' | 'value' | 'onChange'> {
    displayWeekNumbers?: boolean;
    weekStartsOn?: 0 | 2 | 1 | 6 | 5 | 4 | 3;
    value?: Date;
    placeholder?: string;
    defaultDate?: Date;
    min?: Date;
    max?: Date;
    onChange: (value: Date | undefined) => void;
    // In some cases we want to prevent the 'reset' of the value, if value > max or < min
    preventValueReset?: boolean;
    fromFormatter?: (value: string, locale: Locale) => Date;
    toFormatter?: (value: Date, locale: Locale) => string;
    hasToday?: boolean;
}
const DateInput = ({
    value,
    defaultDate,
    placeholder,
    autoFocus,
    onChange,
    onFocus,
    onBlur,
    displayWeekNumbers,
    weekStartsOn,
    min = DEFAULT_MIN,
    max = DEFAULT_MAX,
    preventValueReset = false,
    fromFormatter = fromFormatted,
    toFormatter = toFormatted,
    hasToday = true,
    ...rest
}: Props) => {
    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, open, close } = usePopperAnchor<HTMLInputElement>();

    const [temporaryInput, setTemporaryInput] = useState<string>('');
    const [showTemporary, setShowTemporary] = useState<boolean>(false);

    useEffect(() => {
        setTemporaryInput(getTemporaryInputFromValue(value));
    }, [value ? +value : undefined]);

    const currentInput = useMemo(() => {
        return value ? toFormatter(value, dateLocale) : '';
    }, [value ? +value : undefined]);

    const temporaryValue = useMemo(() => {
        if (!temporaryInput) {
            return;
        }
        try {
            const newDate = fromFormatter(temporaryInput, dateLocale);
            if (newDate < min || newDate > max) {
                /* There are some cases where we do not want to reset the value so that we are able to tell the user
                 *  he made a mistake, by displaying an error.
                 */
                if (preventValueReset) {
                    return newDate;
                }
                return;
            }
            if (Number.isNaN(+newDate)) {
                return;
            }
            return newDate;
            // eslint-disable-next-line no-empty
        } catch (e: any) {}
    }, [temporaryInput]);

    const actualDefaultDate = useMemo(() => defaultDate || new Date(), [defaultDate]);
    const actualValue = temporaryValue || value || actualDefaultDate;

    const parseAndTriggerChange = () => {
        const oldTemporaryInput = temporaryInput;
        // Before the new date is set, the input is reset to the old date in case the onChange handler rejects the change,
        // or it's an invalid date that couldn't be parsed
        setTemporaryInput(getTemporaryInputFromValue(value));
        // Allow a valid parsed date value, or undefined to reset.
        if (temporaryValue || !oldTemporaryInput) {
            onChange(temporaryValue);
        }
    };

    const handleFocusInput = (event: FocusEvent<HTMLInputElement>) => {
        onFocus?.(event);
        open();

        setShowTemporary(true);
        setTemporaryInput(currentInput);
    };

    const handleBlurInput = (event: FocusEvent<HTMLInputElement>) => {
        onBlur?.(event);
        parseAndTriggerChange();
        close();

        setShowTemporary(false);
        setTemporaryInput('');
    };

    useHotkeys(anchorRef, [
        [
            'Escape',
            (e) => {
                if (isOpen) {
                    e.preventDefault();
                    e.stopPropagation();
                    parseAndTriggerChange();
                    close();
                }
            },
        ],
        [
            'Enter',
            (e) => {
                parseAndTriggerChange();
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
                    setTemporaryInput(toFormatted(addDays(actualValue, -1), dateLocale));
                }
            },
        ],
        [
            'ArrowUp',
            (e) => {
                if (isOpen) {
                    e.preventDefault();
                    e.stopPropagation();
                    setTemporaryInput(toFormatted(addDays(actualValue, 1), dateLocale));
                }
            },
        ],
    ]);

    const handleClickDate = (newDate: Date) => {
        setTemporaryInput(toFormatted(newDate, dateLocale));
        setTimeout(() => anchorRef.current?.blur());
    };

    const handleInputChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
        setTemporaryInput(value);
    };

    const placeholderInLocale = useMemo(() => {
        return toFormatted(actualDefaultDate, dateLocale);
    }, [dateLocale, defaultDate]);

    return (
        <>
            <Input
                type="text"
                ref={anchorRef}
                onFocus={handleFocusInput}
                onBlur={handleBlurInput}
                value={showTemporary ? temporaryInput : currentInput}
                onChange={handleInputChange}
                placeholder={
                    placeholder !== undefined ? placeholder : `${c('Placeholder').t`E.g., `}${placeholderInLocale}`
                }
                autoFocus={autoFocus}
                {...rest}
            />
            <Dropdown
                disableFocusTrap
                autoClose={false}
                autoCloseOutside={false}
                id={uid}
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                disableDefaultArrowNavigation
            >
                <LocalizedMiniCalendar
                    date={actualValue}
                    min={min}
                    max={max}
                    onSelectDate={handleClickDate}
                    displayWeekNumbers={displayWeekNumbers}
                    weekStartsOn={weekStartsOn}
                    fixedSize
                    hasToday={hasToday}
                    preventLeaveFocus
                />
            </Dropdown>
        </>
    );
};

export default DateInput;
