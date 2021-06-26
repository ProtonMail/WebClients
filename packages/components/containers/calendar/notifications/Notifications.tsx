import { SETTINGS_NOTIFICATION_TYPE } from '@proton/shared/lib/calendar/constants';
import React from 'react';
import { c } from 'ttag';
import { NotificationModel } from '@proton/shared/lib/interfaces/calendar/Notification';
import { EventModelErrors } from '@proton/shared/lib/interfaces/calendar';
import { addItem, removeItem, updateItem } from '@proton/shared/lib/helpers/array';
import { classnames, generateUID } from '../../../helpers';
import { Tooltip, Icon, ErrorZone, LinkButton } from '../../../components';
import NotificationInput from './inputs/NotificationInput';

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
                if (notification.type === SETTINGS_NOTIFICATION_TYPE.EMAIL) {
                    // Hide email notifications until supported
                    return null;
                }
                return (
                    <div className="mb0-5 flex flex-nowrap flex-align-items-center" key={notification.id}>
                        <NotificationInput
                            hasWhen={hasWhen}
                            hasType={hasType}
                            notification={notification}
                            onChange={(newNotification) => onChange(updateItem(notifications, index, newNotification))}
                            error={errors?.notifications?.fields.includes(index) ? '' : undefined}
                        />
                        <Tooltip title={c('Action').t`Remove this notification`}>
                            <LinkButton
                                data-test-id="delete-notification"
                                className="w2e flex flex-item-noshrink ml0-5"
                                onClick={() => onChange(removeItem(notifications, index))}
                            >
                                <Icon name="trash" className="mauto" />
                                <span className="sr-only">{c('Action').t`Remove this notification`}</span>
                            </LinkButton>
                        </Tooltip>
                    </div>
                );
            })}
            {canAdd && (
                <LinkButton
                    className={classnames(['p0', notifications.length === 0 && 'mt0-5'])}
                    data-test-id="add-notification"
                    title={c('Title').t`Add another notification to remind you of this event`}
                    onClick={() =>
                        onChange(addItem(notifications, { ...defaultNotification, id: generateUID('notification') }))
                    }
                >
                    {c('Action').t`Add notification`}
                </LinkButton>
            )}
            {errors?.notifications?.text && <ErrorZone id={NOTIFICATION_ID}>{errors.notifications.text}</ErrorZone>}
        </>
    );
};

export default Notifications;
