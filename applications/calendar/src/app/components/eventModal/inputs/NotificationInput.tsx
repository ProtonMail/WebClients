import React, { ChangeEvent } from 'react';
import { classnames, IntegerInput, Select, TimeInput } from 'react-components';
import { c } from 'ttag';
import { SETTINGS_NOTIFICATION_TYPE } from 'proton-shared/lib/interfaces/calendar';

import { NOTIFICATION_INPUT_ID } from '../const';
import { NOTIFICATION_UNITS_MAX } from '../../../constants';
import { NotificationModel } from '../../../interfaces/NotificationModel';
import {
    getDaysBefore,
    getHoursBefore,
    getMinutesBefore,
    getSameDay,
    getSameTime,
    getWeeksBefore,
} from './notificationOptions';

const { EMAIL, DEVICE /* BOTH */ } = SETTINGS_NOTIFICATION_TYPE;

interface Props {
    className?: string;
    notification: NotificationModel;
    hasWhen?: boolean;
    hasType?: boolean;
    onChange: (model: NotificationModel) => void;
    error?: string;
}

const getWhenOptions = (isAllDay: boolean, value = 0) => {
    if (isAllDay) {
        return [getSameDay(), getDaysBefore(value), getWeeksBefore(value)];
    }

    return [getSameTime(), getMinutesBefore(value), getHoursBefore(value), getDaysBefore(value), getWeeksBefore(value)];
};

const NotificationInput = ({
    className,
    notification,
    notification: { isAllDay, type, when, value, at, unit },
    hasType = false,
    onChange,
    error,
}: Props) => {
    const safeValue = value === undefined ? 1 : value;

    const options = getWhenOptions(isAllDay, safeValue);
    const textOptions = options.map((option, i) => ({ text: option.text, value: i }));
    const closestOption = options.findIndex((option) => {
        return option.value === safeValue && option.unit === unit && option.when === when;
    });
    const optionsValue = closestOption === -1 ? 0 : closestOption;

    const hasValueInput = value === undefined || value > 0;

    const errorProps = typeof error === 'string' ? { 'aria-invalid': true } : {};

    return (
        <div className={classnames(['flex flex-nowrap flex-item-fluid onmobile-flex-column', className])}>
            <span className="flex flex-nowrap flex-item-fluid">
                {hasValueInput && (
                    <span className="flex-item-fluid mr0-5">
                        <IntegerInput
                            id={NOTIFICATION_INPUT_ID}
                            data-test-id="notification-time-input"
                            step={1}
                            min={0}
                            max={NOTIFICATION_UNITS_MAX[unit]}
                            value={value}
                            onChange={(newValue) => {
                                if (newValue !== undefined && newValue === 0) {
                                    return;
                                }
                                onChange({ ...notification, value: newValue });
                            }}
                            onBlur={() => {
                                if (!value) {
                                    onChange({ ...notification, value: 1 });
                                }
                            }}
                            title={c('Title').t`Choose a number`}
                            {...errorProps}
                        />
                    </span>
                )}
                <Select
                    data-test-id="notification-time-dropdown"
                    className="flex-item-fluid flex-item-grow-2"
                    value={optionsValue}
                    options={textOptions}
                    onChange={({ target }: ChangeEvent<HTMLSelectElement>) => {
                        const optionIndex = +target.value;
                        const option = options[optionIndex];
                        if (!option) {
                            return;
                        }
                        onChange({
                            ...notification,
                            ...option,
                        });
                    }}
                    title={c('Title').t`Select when you want this notification to be sent`}
                    {...errorProps}
                />
            </span>
            {((isAllDay && at) || hasType) && (
                <span className="flex ontinymobile-flex-column flex-nowrap flex-item-fluid">
                    {isAllDay && at && (
                        <span className="flex flex-nowrap flex-item-fluid flex-items-center onmobile-mt0-5">
                            <span className="flex-item-noshrink ml0-5 onmobile-ml0 mr0-5">{c('Notification time input')
                                .t`at`}</span>
                            <TimeInput
                                data-test-id="notification-time-at"
                                value={at}
                                onChange={(at) => onChange({ ...notification, at })}
                                title={c('Title').t`Select the time to send this notification`}
                                {...errorProps}
                            />
                        </span>
                    )}
                    {hasType && (
                        <span
                            className={classnames([
                                'flex flex-nowrap flex-item-fluid onmobile-mt0-5 ml0-5',
                                isAllDay && at ? 'ontinymobile-ml0' : 'onmobile-ml0',
                            ])}
                        >
                            <Select
                                value={type}
                                options={[
                                    { text: c('Notification type').t`via notification`, value: DEVICE },
                                    { text: c('Notification type').t`by email`, value: EMAIL },
                                    // { text: c('Notification type').t`both notification and email`, value: BOTH },
                                ]}
                                onChange={({ target }: ChangeEvent<HTMLSelectElement>) =>
                                    onChange({ ...notification, type: +target.value })
                                }
                                title={c('Title').t`Select the way to send this notification`}
                                {...errorProps}
                            />
                        </span>
                    )}
                </span>
            )}
        </div>
    );
};

export default NotificationInput;
