import React, { ChangeEvent } from 'react';
import { classnames, IntegerInput, Select, TimeInput } from 'react-components';
import { c } from 'ttag';
import { SETTINGS_NOTIFICATION_TYPE } from 'proton-shared/lib/interfaces/calendar';

import { NOTIFICATION_UNITS_MAX } from '../../../constants';
import { NotificationModel } from '../../../interfaces/NotificationModel';
import {
    getDaysAfter,
    getDaysBefore,
    getHoursAfter,
    getHoursBefore,
    getMinutesAfter,
    getMinutesBefore,
    getSameDay,
    getSameTime,
    getWeeksAfter,
    getWeeksBefore
} from './notificationOptions';

const { EMAIL, DEVICE } = SETTINGS_NOTIFICATION_TYPE;

interface Props {
    className?: string;
    notification: NotificationModel;
    hasWhen?: boolean;
    hasType?: boolean;
    onChange: (model: NotificationModel) => void;
}

const getWhenOptions = (isAllDay: boolean, value = 0) => {
    if (isAllDay) {
        return [getSameDay(), getDaysBefore(value), getDaysAfter(value), getWeeksBefore(value), getWeeksAfter(value)];
    }

    return [
        getSameTime(),
        getMinutesBefore(value),
        getMinutesAfter(value),
        getHoursBefore(value),
        getHoursAfter(value),
        getDaysBefore(value),
        getDaysAfter(value)
    ];
};

const NotificationInput = ({
    className,
    notification,
    notification: { isAllDay, type, when, value, at, unit },
    hasType = false,
    onChange
}: Props) => {
    const safeValue = value === undefined ? 1 : value;

    const options = getWhenOptions(isAllDay, safeValue);
    const textOptions = options.map((option, i) => ({ text: option.text, value: i }));
    const closestOption = options.findIndex((option) => {
        return option.value === safeValue && option.unit === unit && option.when === when;
    });
    const optionsValue = closestOption === -1 ? 0 : closestOption;

    const hasValueInput = value === undefined || value > 0;

    return (
        <div
            className={classnames([
                'flex flex-nowrap flex-items-center flex-item-fluid',
                className,
                isAllDay && 'onmobile-flex-column'
            ])}
        >
            <span
                className={classnames([
                    'flex flex-nowrap flex-items-center flex-item-fluid',
                    isAllDay && 'onmobile-mb0-5'
                ])}
            >
                {hasType ? (
                    <Select
                        className="mr1"
                        value={type}
                        options={[
                            { text: c('Notification type').t`Notification`, value: DEVICE },
                            { text: c('Notification type').t`Email`, value: EMAIL }
                        ]}
                        onChange={({ target }: ChangeEvent<HTMLSelectElement>) =>
                            onChange({ ...notification, type: +target.value })
                        }
                    />
                ) : null}
                {hasValueInput ? (
                    <span className="relative w6e mr1 flex-item-noshrink">
                        <IntegerInput
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
                        />
                    </span>
                ) : null}
                <Select
                    data-test-id="notification-time-dropdown"
                    className={classnames([isAllDay && 'mr1 onmobile-mr0'])}
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
                            ...option
                        });
                    }}
                />
            </span>
            {isAllDay && at ? (
                <span className="flex flex-nowrap flex-items-center w30">
                    <span className="flex-item-noshrink">{c('').t`at`}</span>
                    <TimeInput
                        data-test-id="notification-time-at"
                        className="ml1"
                        value={at}
                        onChange={(at) => onChange({ ...notification, at })}
                    />
                </span>
            ) : null}
        </div>
    );
};

export default NotificationInput;
