import getNotificationsTexts from '@proton/components/containers/calendar/notifications/getNotificationsTexts';
import {
    NOTIFICATION_INPUT_ID,
    NOTIFICATION_TYPE_API,
    NOTIFICATION_UNITS_MAX,
} from '@proton/shared/lib/calendar/constants';
import { NotificationModel } from '@proton/shared/lib/interfaces/calendar/Notification';
import clsx from '@proton/utils/clsx';

import { DropdownSizeUnit, IntegerInput, Option, SelectTwo, TimeInput } from '../../../../components';
import {
    getDaysBefore,
    getHoursBefore,
    getMinutesBefore,
    getSameDay,
    getSameTime,
    getWeeksBefore,
} from './notificationOptions';

const { EMAIL, DEVICE /* BOTH */ } = NOTIFICATION_TYPE_API;

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
            className={clsx(
                'flex flex-nowrap flex-item-fluid',
                className,
                fullWidth ? 'on-mobile-flex-column' : 'on-tablet-flex-column'
            )}
        >
            {hasType && (
                <span
                    className={clsx(
                        'flex flex-nowrap mr-2 my-2',
                        fullWidth ? 'md:my-0' : 'lg:my-0',
                        !(isAllDay && at) && 'w10e'
                    )}
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
                    <span className="flex-item-noshrink mr-2 w5e">
                        <IntegerInput
                            id={NOTIFICATION_INPUT_ID}
                            data-testid="notification-time-input"
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
                    data-testid="notification-time-dropdown"
                    className="flex-item-fluid"
                    size={{ width: DropdownSizeUnit.Dynamic }}
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
                        <Option key={value} value={value} title={text} truncate />
                    ))}
                </SelectTwo>
            </span>
            {isAllDay && at && (
                <span className="flex on-tiny-mobile-flex-column flex-nowrap">
                    {isAllDay && at && (
                        <span
                            className={clsx(
                                'flex flex-nowrap flex-item-fluid flex-align-items-center mt-2',
                                fullWidth ? 'md:mt-0' : 'lg:mt-0'
                            )}
                        >
                            <span className={clsx('flex-item-noshrink ml-0 mr-2', fullWidth ? 'md:ml-2' : 'lg:ml-2')}>
                                {atText}
                            </span>
                            <span className="w8e">
                                <TimeInput
                                    data-testid="notification-time-at"
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
