import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import getNotificationsTexts from '@proton/components/containers/calendar/notifications/getNotificationsTexts';
import {
    NOTIFICATION_INPUT_ID,
    NOTIFICATION_TYPE_API,
    NOTIFICATION_UNITS_MAX,
} from '@proton/shared/lib/calendar/constants';
import type { NotificationModel } from '@proton/shared/lib/interfaces/calendar/Notification';
import clsx from '@proton/utils/clsx';

import { IntegerInput, Option, SelectTwo, TimeInput } from '../../../../components';
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
                'flex flex-column flex-nowrap flex-1',
                className,
                fullWidth ? 'md:flex-row' : 'lg:flex-row'
            )}
        >
            {hasType && (
                <span
                    className={clsx(
                        'flex flex-nowrap my-2',
                        fullWidth ? 'md:my-0 md:mr-2' : 'lg:my-0 lg:mr-2',
                        !(isAllDay && at) && `w-full ${fullWidth ? 'md:w-custom' : 'lg:w-custom'}`
                    )}
                    style={!(isAllDay && at) ? { [`--${fullWidth ? 'md' : 'lg'}-w-custom`]: '10em' } : undefined}
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
            <span className={clsx('flex flex-nowrap', fullWidth ? 'md:flex-1' : 'lg:flex-1')}>
                {hasValueInput && (
                    <span className="shrink-0 mr-2 w-custom" style={{ '--w-custom': '5em' }}>
                        <IntegerInput
                            id={`${NOTIFICATION_INPUT_ID}-${id}`}
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
                            aria-describedby={`${id} ${NOTIFICATION_INPUT_ID}-${id} time-before-${id} time-before-at-${id} time-before-hour-${id}`}
                            {...errorProps}
                        />
                    </span>
                )}
                <SelectTwo
                    data-testid="notification-time-dropdown"
                    id={`time-before-${id}`}
                    className="flex-1"
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
                    aria-describedby={`${id} ${NOTIFICATION_INPUT_ID}-${id} time-before-${id} time-before-at-${id} time-before-hour-${id}`}
                    //aria-label="Select un truc pour voir"
                    {...errorProps}
                >
                    {textOptions.map(({ value, text }) => (
                        <Option key={value} value={value} title={text} truncate />
                    ))}
                </SelectTwo>
            </span>
            {isAllDay && at && (
                <span className="flex flex-column sm:flex-row flex-nowrap">
                    {isAllDay && at && (
                        <span
                            className={clsx(
                                'flex flex-nowrap sm:flex-1 items-center mt-2',
                                fullWidth ? 'md:mt-0' : 'lg:mt-0'
                            )}
                        >
                            <span
                                id={`time-before-at-${id}`}
                                className={clsx('shrink-0 ml-0 mr-2', fullWidth ? 'md:ml-2' : 'lg:ml-2')}
                            >
                                {atText}
                            </span>
                            <span className="w-custom" style={{ '--w-custom': '8em' }}>
                                <TimeInput
                                    id={`time-before-hour-${id}`}
                                    data-testid="notification-time-at"
                                    value={at}
                                    disabled={disabled}
                                    onChange={(at) => onEdit({ ...notification, at })}
                                    title={timeToSendText}
                                    aria-describedby={`${id} ${NOTIFICATION_INPUT_ID}-${id} time-before-${id} time-before-at-${id} time-before-hour-${id}`}
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
