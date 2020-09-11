import React from 'react';
import { LinkButton, ErrorZone, Icon } from 'react-components';
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

const Notifications = ({
    notifications,
    hasWhen,
    hasType,
    canAdd = true,
    defaultNotification,
    onChange,
    errors,
}: Props) => {
    return (
        <>
            {notifications.map((notification, index) => {
                return (
                    <div className="mb1 flex flex-nowrap flex-items-center">
                        <NotificationInput
                            hasWhen={hasWhen}
                            hasType={hasType}
                            notification={notification}
                            onChange={(newNotification) => onChange(updateItem(notifications, index, newNotification))}
                            error={errors?.notifications?.fields.includes(index) ? '' : undefined}
                        />
                        <LinkButton
                            data-test-id="delete-notification"
                            className="w2e flex flex-item-noshrink ml0-5"
                            title={c('Action').t`Remove this notification`}
                            onClick={() => onChange(removeItem(notifications, index))}
                        >
                            <Icon name="trash" className="mauto" />
                        </LinkButton>
                    </div>
                );
            })}
            {canAdd && (
                <LinkButton
                    className="p0"
                    data-test-id="add-notification"
                    title={c('Title').t`Add another notification to remind you this event`}
                    onClick={() => onChange(addItem(notifications, { ...defaultNotification }))}
                >
                    {c('Action').t`Add notification`}
                </LinkButton>
            )}
            {errors?.notifications?.text && <ErrorZone id={NOTIFICATION_ID}>{errors.notifications.text}</ErrorZone>}
        </>
    );
};

export default Notifications;
