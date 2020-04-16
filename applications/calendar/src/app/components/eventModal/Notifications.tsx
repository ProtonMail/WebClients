import React from 'react';
import { LinkButton } from 'react-components';
import { c } from 'ttag';

import NotificationInput from './inputs/NotificationInput';
import { updateItem, removeItem, addItem } from './eventForm/arrayHelper';
import { NotificationModel } from '../../interfaces/NotificationModel';

interface Props {
    notifications: NotificationModel[];
    hasWhen?: boolean;
    hasType?: boolean;
    canAdd?: boolean;
    defaultNotification: NotificationModel;
    onChange: (value: NotificationModel[]) => void;
}

const Notifications = ({ notifications, hasWhen, hasType, canAdd = true, defaultNotification, onChange }: Props) => {
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
                            data-test-id="delete-notification"
                            className="flex-item-noshrink ml0-5"
                            title={c('Action').t`Remove notification`}
                            onClick={() => onChange(removeItem(notifications, index))}
                        >{c('Action').t`Delete`}</LinkButton>
                    </div>
                );
            })}
            {canAdd && (
                <div>
                    <LinkButton
                        data-test-id="add-notification"
                        onClick={() => onChange(addItem(notifications, { ...defaultNotification }))}
                    >{c('Action').t`Add notification`}</LinkButton>
                </div>
            )}
        </div>
    );
};

export default Notifications;
