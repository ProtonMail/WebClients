import React from 'react';
import PropTypes from 'prop-types';
import { LinkButton } from 'react-components';
import { c } from 'ttag';

import NotificationInput from './NotificationInput';
import { updateItem, removeItem, addItem } from './eventForm/state';

const Notifications = ({ notifications, hasWhen, hasType, defaultNotification, onChange }) => {
    return (
        <div>
            {notifications.map((notification, index) => {
                const key = `${index}`;
                return (
                    <div key={key} className="mb1 flex flex-nowrap">
                        <NotificationInput
                            className="mr1"
                            hasWhen={hasWhen}
                            hasType={hasType}
                            notification={notification}
                            onChange={(newNotification) => onChange(updateItem(notifications, index, newNotification))}
                        />
                        <LinkButton
                            className="flex-item-noshrink ml0-5"
                            title={c('Action').t`Remove notification`}
                            onClick={() => onChange(removeItem(notifications, index))}
                        >{c('Action').t`Delete`}</LinkButton>
                    </div>
                );
            })}
            <div>
                <LinkButton onClick={() => onChange(addItem(notifications, { ...defaultNotification }))}>{c('Action')
                    .t`Add notification`}</LinkButton>
            </div>
        </div>
    );
};

Notifications.propTypes = {
    isAllDay: PropTypes.bool,
    hasType: PropTypes.bool,
    hasWhen: PropTypes.bool,
    notifications: PropTypes.array,
    defaultNotification: PropTypes.object,
    onChange: PropTypes.func
};

export default Notifications;
