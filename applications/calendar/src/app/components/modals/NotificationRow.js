import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Row, Label, LinkButton } from 'react-components';
import { c } from 'ttag';

import NotificationInput from './NotificationInput';
import { MINUTE } from '../../constants';

const DEFAULT_NOTIFICATION = {
    type: 'email',
    unit: MINUTE,
    time: 30
};

const NotificationRow = ({ model, updateModel }) => {
    const handleAdd = () => {
        const notifications = [...model.notifications, DEFAULT_NOTIFICATION];
        updateModel({ ...model, notifications });
    };

    const handleRemove = (index) => () => {
        const notifications = [...model.notifications];
        notifications.splice(index, 1);
        updateModel({ ...model, notifications });
    };

    const handleChange = (index, key, value) => {
        const notifications = [...model.notifications];
        notifications[index][key] = value;
        updateModel({ ...model, notifications });
    };

    useEffect(() => {
        if (!model.notifications.length) {
            handleAdd();
        }
    }, []);

    return (
        <Row>
            <Label>{c('Label').t`Email notifications`}</Label>
            <div>
                {model.notifications.map(({ type, time, unit, trigger }, index) => {
                    const key = `${index}`;
                    return (
                        <div key={key} className="mb1 flex flex-nowrap">
                            <NotificationInput
                                type={type}
                                time={time}
                                unit={unit}
                                trigger={trigger}
                                onChangeType={(newType) => handleChange(index, 'type', newType)}
                                onChangeTime={(newTime) => handleChange(index, 'time', newTime)}
                                onChangeUnit={(newUnit) => handleChange(index, 'unit', newUnit)}
                                onChangeTrigger={(newTrigger) => handleChange(index, 'trigger', newTrigger)}
                            />
                            <LinkButton
                                className="flex-item-noshrink"
                                title={c('Action').t`Remove notification`}
                                onClick={handleRemove(index)}
                            >{c('Action').t`Delete`}</LinkButton>
                        </div>
                    );
                })}
                <div>
                    <LinkButton onClick={handleAdd}>{c('Action').t`Add notification`}</LinkButton>
                </div>
            </div>
        </Row>
    );
};

NotificationRow.propTypes = {
    model: PropTypes.object,
    updateModel: PropTypes.func
};

export default NotificationRow;
