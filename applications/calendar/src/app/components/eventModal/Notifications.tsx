import React from 'react';
import { LinkButton, ErrorZone } from 'react-components';
import { c } from 'ttag';

import NotificationInput from './inputs/NotificationInput';
import { updateItem, removeItem, addItem } from './eventForm/arrayHelper';
import { NotificationModel } from '../../interfaces/NotificationModel';
import { EventModelErrors } from '../../interfaces/EventModel';

export const NOTIFICATION_ID = 'notifications';
interface Props {
    notifications: NotificationModel[];
    hasWhen?: boolean;
    hasType?: boolean;
    canAdd?: boolean;
    defaultNotification: NotificationModel;
    onChange: (value: NotificationModel[]) => void;
    errors?: EventModelErrors;
}

const Notifications = ({ notifications, hasWhen, hasType, canAdd = true, defaultNotification, onChange, errors }: Props) => {
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
                            error={errors?.notifications?.fields.includes(index) ? '' : undefined}
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
            <ErrorZone id={NOTIFICATION_ID}>
                {errors?.notifications?.text || ''}
            </ErrorZone>
        </div>
    );
};

export default Notifications;
