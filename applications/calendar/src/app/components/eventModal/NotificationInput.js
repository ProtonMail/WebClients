import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Input, Select, TimeInput, classnames } from 'react-components';
import { c, msgid } from 'ttag';

import { NOTIFICATION_UNITS, NOTIFICATION_WHEN, NOTIFICATION_TYPE } from '../../constants';

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

    /**
     * For all day events that are before, the day and hour needs to be modified to correctly say e.g.
     * 1 day before at 9 am for -PT15H
     */
    const modifiedValue = isAllDayBefore && unit === NOTIFICATION_UNITS.DAY ? value + 1 : value;

    const modifiedAt = useMemo(() => {
        if (isAllDayBefore) {
            return new Date(at.getFullYear(), at.getMonth(), at.getDate(), 24 - at.getHours(), at.getMinutes());
        }
        return at;
    }, [isAllDay, at, when]);

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
        <div className={classnames(['flex flex-nowrap flex-items-center', className])}>
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
            <Input
                type="number"
                className="mr1"
                value={modifiedValue}
                onChange={({ target }) => {
                    const newValue = +target.value;
                    if (isAllDayBefore && unit === NOTIFICATION_UNITS.DAY) {
                        if (newValue <= 0) {
                            return;
                        }
                        onChange({ ...notification, value: newValue - 1 });
                        return;
                    }
                    if (newValue < 0) {
                        return;
                    }
                    onChange({ ...notification, value: newValue });
                }}
            />
            <Select
                className="mr1"
                value={unit}
                options={[
                    !isAllDay && {
                        text: c('Time unit').ngettext(msgid`Minute`, 'Minutes', modifiedValue),
                        value: MINUTES
                    },
                    !isAllDay && { text: c('Time unit').ngettext(msgid`Hour`, 'Hours', modifiedValue), value: HOURS },
                    { text: c('Time unit').ngettext(msgid`Day`, 'Days', modifiedValue), value: DAY },
                    { text: c('Time unit').ngettext(msgid`Week`, 'Weeks', modifiedValue), value: WEEK }
                ].filter(Boolean)}
                onChange={({ target }) => onChange({ ...notification, unit: +target.value })}
            />
            {hasWhen ? (
                <Select
                    className="mr1"
                    value={when}
                    options={[
                        { text: notificationI18N[BEFORE], value: BEFORE },
                        { text: notificationI18N[AFTER], value: AFTER }
                    ]}
                    onChange={({ target }) => onChange({ ...notification, when: target.value })}
                />
            ) : (
                notificationI18N[when].toLowerCase()
            )}
            {isAllDay ? (
                <TimeInput
                    value={modifiedAt}
                    onChange={(at) => {
                        if (isAllDayBefore) {
                            onChange({
                                ...notification,
                                at: new Date(
                                    at.getFullYear(),
                                    at.getMonth(),
                                    at.getDate(),
                                    24 - at.getHours(),
                                    at.getMinutes()
                                )
                            });
                            return;
                        }
                        onChange({
                            ...notification,
                            at
                        });
                    }}
                />
            ) : null}
        </div>
    );
};

const NotificationShape = PropTypes.shape({
    value: PropTypes.number,
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
