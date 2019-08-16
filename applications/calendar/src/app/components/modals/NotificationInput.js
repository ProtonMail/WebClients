import React from 'react';
import PropTypes from 'prop-types';
import { Input, Select, TimeSelect, classnames } from 'react-components';
import { c } from 'ttag';

import { MINUTE, HOUR, DAY, WEEK, BEFORE, AFTER, NOTIFICATION_TYPE } from '../../constants';

const { EMAIL, DEVICE } = NOTIFICATION_TYPE;

const NotificationInput = ({
    trigger,
    time,
    limit,
    unit,
    onChangeUnit,
    onChangeTime,
    onChangeTrigger,
    onChangeLimit,
    className,
    allDay = false
}) => {
    return (
        <div className={classnames(['flex flex-nowrap', className])}>
            {/* <Select
                className="mr1"
                value={type}
                options={[
                    { text: c('Notification type').t`Notification`, value: DEVICE },
                    { text: c('Notification type').t`Email`, value: EMAIL }
                ]}
                onChange={({ target }) => onChangeType(target.value)} /> */}
            <Input type="number" className="mr1" value={time} onChange={({ target }) => onChangeTime(+target.value)} />
            <Select
                className="mr1"
                value={unit}
                options={[
                    { text: c('Time unit').t`Minutes`, value: MINUTE },
                    { text: c('Time unit').t`Hours`, value: HOUR },
                    { text: c('Time unit').t`Days`, value: DAY },
                    { text: c('Time unit').t`Weeks`, value: WEEK }
                ]}
                onChange={({ target }) => onChangeUnit(target.value)}
            />
            {allDay ? (
                <Select
                    value={trigger}
                    options={[
                        { text: c('Event trigger').t`Before`, value: BEFORE },
                        { text: c('Event trigger').t`After`, value: AFTER }
                    ]}
                    onChange={({ target }) => onChangeTrigger(target.value)}
                />
            ) : (
                <>
                    <Select
                        className="mr1"
                        value={trigger}
                        options={[
                            { text: c('Event trigger').t`Before at`, value: BEFORE },
                            { text: c('Event trigger').t`After at`, value: AFTER }
                        ]}
                        onChange={({ target }) => onChangeTrigger(target.value)}
                    />
                    <TimeSelect value={limit} onChange={(l) => onChangeLimit(l)} />
                </>
            )}
        </div>
    );
};

NotificationInput.propTypes = {
    allDay: PropTypes.bool,
    time: PropTypes.number,
    limit: PropTypes.number,
    unit: PropTypes.string,
    type: PropTypes.oneOf([EMAIL, DEVICE]),
    trigger: PropTypes.oneOf([BEFORE, AFTER]),
    onChangeTime: PropTypes.func,
    onChangeUnit: PropTypes.func,
    onChangeTrigger: PropTypes.func,
    onChangeType: PropTypes.func,
    onChangeLimit: PropTypes.func,
    className: PropTypes.string
};

export default NotificationInput;
