import { ButtonLike } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import IntegerInput from '@proton/components/components/input/IntegerInput';
import TimeInput from '@proton/components/components/input/TimeInput';
import getNotificationsTexts from '@proton/components/containers/calendar/notifications/getNotificationsTexts';
import {
    NOTIFICATION_INPUT_ID,
    NOTIFICATION_TYPE_API,
    NOTIFICATION_UNITS_MAX,
} from '@proton/shared/lib/calendar/constants';
import type { NotificationModel } from '@proton/shared/lib/interfaces/calendar/Notification';
import clsx from '@proton/utils/clsx';

import { Option, SelectTwo, Tooltip } from '../../../../components';
import {
    getDaysBefore,
    getHoursBefore,
    getMinutesBefore,
    getSameDay,
    getSameTime,
    getWeeksBefore,
} from './notificationOptions';

const { EMAIL, DEVICE } = NOTIFICATION_TYPE_API;

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
    onDelete: () => void;
}

const getWhenOptions = (isAllDay: boolean, value = 0) => {
    if (isAllDay) {
        return [getSameDay(), getDaysBefore(value), getWeeksBefore(value)];
    }

    return [getSameTime(), getMinutesBefore(value), getHoursBefore(value), getDaysBefore(value), getWeeksBefore(value)];
};

const NotificationInputInDrawer = ({
    id,
    className,
    notification,
    notification: { isAllDay, type, when, value, at, unit },
    hasType = false,
    fullWidth = true,
    disabled = false,
    onEdit,
    error,
    onDelete,
}: Props) => {
    const {
        removeNotificationText,
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
        <div key={notification.id} className={clsx('flex flex-column items-stretch flex-1 gap-2 mb-4', className)}>
            {hasType && (
                <span className="flex flex-nowrap gap-2">
                    <SelectTwo
                        id={id}
                        value={type}
                        disabled={disabled}
                        onChange={({ value }) => onEdit({ ...notification, type: +value })}
                        title={howToSendText}
                        className="flex-1"
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
                    <span className="shrink-0">
                        <Tooltip title={removeNotificationText}>
                            <ButtonLike
                                data-testid="delete-notification"
                                className="flex shrink-0"
                                disabled={disabled}
                                onClick={onDelete}
                                icon
                                type="button"
                                shape="ghost"
                                color="norm"
                            >
                                <Icon name="trash" className="shrink-0" />
                                <span className="sr-only">{removeNotificationText}</span>
                            </ButtonLike>
                        </Tooltip>
                    </span>
                </span>
            )}
            <span className={clsx('flex flex-column gap-2', fullWidth ? 'md:flex-row' : 'lg:flex-row')}>
                <span
                    className={clsx('flex flex-nowrap gap-2 grow-custom', fullWidth ? 'md:flex-1' : 'lg:flex-1')}
                    style={{ '--grow-custom': '1.5' }}
                >
                    {hasValueInput && (
                        <span className="shrink-0 w-custom" style={{ '--w-custom': '4.5em' }}>
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
                    <span className={clsx(fullWidth ? 'md:flex-1' : 'lg:flex-1')}>
                        <SelectTwo
                            data-testid="notification-time-dropdown"
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
                </span>
                {isAllDay && at && (
                    <span className={clsx(fullWidth ? 'md:flex-1' : 'lg:flex-1')}>
                        <TimeInput
                            data-testid="notification-time-at"
                            value={at}
                            prefix={atText}
                            disabled={disabled}
                            onChange={(at) => onEdit({ ...notification, at })}
                            title={timeToSendText}
                            {...errorProps}
                        />
                    </span>
                )}
            </span>
        </div>
    );
};

export default NotificationInputInDrawer;
