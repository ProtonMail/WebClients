import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Select, Button, Input } from 'react-components';
import { c } from 'ttag';

const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;

const DEFAULT_NOTIFICATION = {
    type: 'notification',
    unit: MINUTE,
    time: 30
};

const Notifications = ({ model, updateModel }) => {
    const types = [
        { text: c('Notification type').t`Notification`, value: 'notification' },
        { text: c('Notification type').t`Email`, value: 'email' }
    ];
    const units = [
        { text: c('Time unit').t`Minutes`, value: MINUTE },
        { text: c('Time unit').t`Hours`, value: HOUR },
        { text: c('Time unit').t`Days`, value: DAY },
        { text: c('Time unit').t`Weeks`, value: WEEK }
    ];

    const handleAdd = () => {
        const notifications = [...model.notifications, DEFAULT_NOTIFICATION];
        updateModel({ ...model, notifications });
    };

    const handleRemove = (index) => () => {
        const notifications = [...model.notifications];
        notifications.splice(index, 1);
        updateModel({ ...model, notifications });
    };

    const handleChange = (index, key) => ({ target }) => {
        const notifications = [...model.notifications];
        notifications[index][key] = target.value;
        updateModel({ ...model, notifications });
    };

    useEffect(() => {
        if (!model.notifications.length) {
            handleAdd();
        }
    }, []);

    return (
        <>
            {model.notifications.map(({ type, time, unit }, index) => {
                const key = `${index}`;
                return (
                    <div key={key} className="mb1 flex flex-nowrap">
                        <Select className="mr1" value={type} options={types} onChange={handleChange(index, 'type')} />
                        <Input className="mr1" value={time} onChange={handleChange(index, 'time')} />
                        <Select className="mr1" value={unit} options={units} onChange={handleChange(index, 'unit')} />
                        <Button
                            className="flex-item-noshrink"
                            title={c('Action').t`Remove notification`}
                            onClick={handleRemove(index)}
                            icon="close"
                        />
                    </div>
                );
            })}
            <div className="mb1">
                <Button onClick={handleAdd}>{c('Action').t`Add notification`}</Button>
            </div>
        </>
    );
};

Notifications.propTypes = {
    model: PropTypes.object,
    updateModel: PropTypes.func
};

export default Notifications;
