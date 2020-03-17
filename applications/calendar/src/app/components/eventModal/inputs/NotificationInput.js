import React from 'react';
import PropTypes from 'prop-types';
import { Select, TimeInput, classnames } from 'react-components';
import { c, msgid } from 'ttag';

import { NOTIFICATION_UNITS, NOTIFICATION_UNITS_MAX, NOTIFICATION_WHEN, NOTIFICATION_TYPE } from '../../../constants';
import IntegerInput from './IntegerInput';

const { EMAIL, DEVICE } = NOTIFICATION_TYPE;
const { DAY, MINUTES, HOURS, WEEK } = NOTIFICATION_UNITS;
const { BEFORE, AFTER } = NOTIFICATION_WHEN;

const NotificationInput = ({
    className,
    notification,
    notification: { isAllDay, type, when, value, at, unit },
    hasWhen = false,
    hasType = false,
    onChange
}) => {
    const isAllDayBefore = isAllDay && when === BEFORE;

    const maxValue = NOTIFICATION_UNITS_MAX[unit];
    const numberValue = Math.min(+value || 0, maxValue);

    const notificationI18N = isAllDay
        ? {
              [BEFORE]: c('Event trigger').t`Before at`,
              [AFTER]: c('Event trigger').t`After at`
          }
        : {
              [BEFORE]: c('Event trigger').t`Before`,
              [AFTER]: c('Event trigger').t`After`
          };

    return (
        <div
            className={classnames([
                'flex flex-nowrap flex-items-center flex-item-fluid',
                className,
                isAllDay && 'onmobile-flex-column'
            ])}
        >
            <span className={classnames(['flex flex-nowrap flex-items-center', isAllDay && 'onmobile-mb0-5'])}>
                {hasType ? (
                    <Select
                        className="mr1"
                        value={type}
                        options={[
                            { text: c('Notification type').t`Notification`, value: DEVICE },
                            { text: c('Notification type').t`Email`, value: EMAIL }
                        ]}
                        onChange={({ target }) => onChange({ ...notification, type: +target.value })}
                    />
                ) : null}
                <IntegerInput
                    data-test-id="notification-time-input"
                    className="mr1"
                    step={1}
                    min={0}
                    max={maxValue}
                    value={value === '' ? '' : numberValue}
                    onChange={(newValue) => {
                        if (isAllDayBefore && unit === NOTIFICATION_UNITS.DAY) {
                            if (newValue <= 0) {
                                onChange({ ...notification, value: 1 });
                                return;
                            }
                        }
                        onChange({ ...notification, value: newValue });
                    }}
                    onBlur={() => {
                        if (value === '') {
                            onChange({ ...notification, value: 0 });
                        }
                    }}
                />
                <Select
                    data-test-id="notification-time-dropdown"
                    className={classnames(['mr1', isAllDay && 'onmobile-mr0'])}
                    value={unit}
                    options={[
                        !isAllDay && {
                            text: c('Time unit').ngettext(msgid`Minute`, `Minutes`, numberValue),
                            value: MINUTES
                        },
                        !isAllDay && {
                            text: c('Time unit').ngettext(msgid`Hour`, `Hours`, numberValue),
                            value: HOURS
                        },
                        { text: c('Time unit').ngettext(msgid`Day`, `Days`, numberValue), value: DAY },
                        { text: c('Time unit').ngettext(msgid`Week`, `Weeks`, numberValue), value: WEEK }
                    ].filter(Boolean)}
                    onChange={({ target }) => {
                        const newUnit = +target.value;
                        if (isAllDay && newUnit === DAY && value === 0 && when === BEFORE) {
                            onChange({ ...notification, value: 1, unit: newUnit });
                            return;
                        }
                        const normalizedValue = Math.min(notification.value, NOTIFICATION_UNITS_MAX[newUnit]);
                        onChange({ ...notification, value: normalizedValue, unit: newUnit });
                    }}
                />
            </span>
            <span data-test-id="notification-time-before-at" className="flex flex-nowrap flex-items-center">
                {hasWhen ? (
                    <Select
                        className="mr1 flex-item-noshrink pr0-5"
                        value={when}
                        options={[
                            { text: notificationI18N[BEFORE], value: BEFORE },
                            { text: notificationI18N[AFTER], value: AFTER }
                        ]}
                        onChange={({ target }) => onChange({ ...notification, when: target.value })}
                    />
                ) : (
                    <span className="flex-item-noshrink pr0-5">{notificationI18N[when].toLowerCase()}</span>
                )}
                {isAllDay ? <TimeInput value={at} onChange={(at) => onChange({ ...notification, at })} /> : null}
            </span>
        </div>
    );
};

const NotificationShape = PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    isAllDay: PropTypes.bool,
    at: PropTypes.instanceOf(Date),
    unit: PropTypes.oneOf([WEEK, DAY, HOURS, MINUTES]),
    type: PropTypes.oneOf([EMAIL, DEVICE]),
    when: PropTypes.oneOf([BEFORE, AFTER])
});

NotificationInput.propTypes = {
    notification: NotificationShape,
    onChange: PropTypes.func,
    hasWhen: PropTypes.bool,
    hasType: PropTypes.bool,
    className: PropTypes.string
};

export default NotificationInput;
