import getNotificationsTexts from '@proton/components/containers/calendar/notifications/getNotificationsTexts';
import {
    NOTIFICATION_INPUT_ID,
    NOTIFICATION_UNITS_MAX,
    SETTINGS_NOTIFICATION_TYPE,
} from '@proton/shared/lib/calendar/constants';
import { NotificationModel } from '@proton/shared/lib/interfaces/calendar/Notification';

import { IntegerInput, Option, SelectTwo, TimeInput } from '../../../../components';
import { classnames } from '../../../../helpers';
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
    id: string;
    className?: string;
    notification: NotificationModel;
    hasWhen?: boolean;
    hasType?: boolean;
    fullWidth?: boolean;
    disabled?: boolean;
    onEdit: (model: NotificationModel) => void;
    error?: string;
}

const getWhenOptions = (isAllDay: boolean, value = 0) => {
    if (isAllDay) {
        return [getSameDay(), getDaysBefore(value), getWeeksBefore(value)];
    }

    return [getSameTime(), getMinutesBefore(value), getHoursBefore(value), getDaysBefore(value), getWeeksBefore(value)];
};

const NotificationInput = ({
    id,
    className,
    notification,
    notification: { isAllDay, type, when, value, at, unit },
    hasType = false,
    fullWidth = true,
    disabled = false,
    onEdit,
    error,
}: Props) => {
    const {
        notificationTypeText,
        emailTypeText,
        howToSendText,
        whenToSendText,
        timeToSendText,
        atText,
        chooseANumberText,
    } = getNotificationsTexts();

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
        <div
            className={classnames([
                'flex flex-nowrap flex-item-fluid',
                className,
                fullWidth ? 'on-mobile-flex-column' : 'on-tablet-flex-column',
            ])}
        >
            {hasType && (
                <span
                    className={classnames([
                        'flex flex-nowrap mr0-5',
                        fullWidth ? 'on-mobile-mt0-5 on-mobile-mb0-5' : 'on-tablet-mt0-5 on-tablet-mb0-5',
                        isAllDay && at
                            ? 'on-tiny-mobile-ml0'
                            : classnames(['w10e', fullWidth ? 'on-mobile-ml0' : 'on-tablet-ml0']),
                    ])}
                >
                    <SelectTwo
                        id={id}
                        value={type}
                        disabled={disabled}
                        onChange={({ value }) => onEdit({ ...notification, type: +value })}
                        title={howToSendText}
                        {...errorProps}
                    >
                        {[
                            { text: notificationTypeText, value: DEVICE },
                            { text: emailTypeText, value: EMAIL },
                            // { text: c('Notification type').t`both notification and email`, value: BOTH },
                        ].map(({ value, text }) => (
                            <Option key={value} value={value} title={text} />
                        ))}
                    </SelectTwo>
                </span>
            )}
            <span className="flex flex-nowrap flex-item-fluid">
                {hasValueInput && (
                    <span className="flex-item-noshrink mr0-5 w5e">
                        <IntegerInput
                            id={NOTIFICATION_INPUT_ID}
                            data-test-id="notification-time-input"
                            step={1}
                            min={0}
                            max={NOTIFICATION_UNITS_MAX[unit]}
                            value={value}
                            disabled={disabled}
                            onChange={(newValue) => {
                                if (newValue !== undefined && newValue === 0) {
                                    return;
                                }
                                onEdit({ ...notification, value: newValue });
                            }}
                            onBlur={() => {
                                if (!value) {
                                    onEdit({ ...notification, value: 1 });
                                }
                            }}
                            title={chooseANumberText}
                            {...errorProps}
                        />
                    </span>
                )}
                <SelectTwo
                    data-test-id="notification-time-dropdown"
                    className="flex-item-fluid"
                    value={optionsValue}
                    disabled={disabled}
                    onChange={({ value }) => {
                        const optionIndex = +value;
                        const option = options[optionIndex];
                        if (!option) {
                            return;
                        }
                        onEdit({
                            ...notification,
                            ...option,
                        });
                    }}
                    title={whenToSendText}
                    {...errorProps}
                >
                    {textOptions.map(({ value, text }) => (
                        <Option key={value} value={value} title={text} />
                    ))}
                </SelectTwo>
            </span>
            {isAllDay && at && (
                <span className="flex on-tiny-mobile-flex-column flex-nowrap">
                    {isAllDay && at && (
                        <span
                            className={classnames([
                                'flex flex-nowrap flex-item-fluid flex-align-items-center',
                                fullWidth ? 'on-mobile-mt0-5' : 'on-tablet-mt0-5',
                            ])}
                        >
                            <span
                                className={classnames([
                                    'flex-item-noshrink ml0-5 mr0-5',
                                    fullWidth ? 'on-mobile-ml0' : 'on-tablet-ml0',
                                ])}
                            >
                                {atText}
                            </span>
                            <span className="w8e">
                                <TimeInput
                                    data-test-id="notification-time-at"
                                    value={at}
                                    disabled={disabled}
                                    onChange={(at) => onEdit({ ...notification, at })}
                                    title={timeToSendText}
                                    {...errorProps}
                                />
                            </span>
                        </span>
                    )}
                </span>
            )}
        </div>
    );
};

export default NotificationInput;
