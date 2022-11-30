import { Button, ButtonLike } from '@proton/atoms';
import getNotificationsTexts from '@proton/components/containers/calendar/notifications/getNotificationsTexts';
import { NotificationModel } from '@proton/shared/lib/interfaces/calendar/Notification';
import addItem from '@proton/utils/addItem';
import clsx from '@proton/utils/clsx';
import removeItem from '@proton/utils/removeIndex';
import updateItem from '@proton/utils/updateItem';

import { Icon, IconName, Tooltip } from '../../../components';
import { generateUID } from '../../../helpers';
import NotificationInput from './inputs/NotificationInput';

export const NOTIFICATION_ID = 'notifications';

interface Props {
    id: string;
    notifications: NotificationModel[];
    hasWhen?: boolean;
    hasType?: boolean;
    fullWidth?: boolean;
    canAdd?: boolean;
    addIcon?: IconName;
    defaultNotification: NotificationModel;
    disabled?: boolean;
    onChange: (value: NotificationModel[]) => void;
}

const Notifications = ({
    id,
    notifications,
    hasWhen,
    hasType,
    fullWidth = true,
    canAdd = true,
    addIcon,
    defaultNotification,
    disabled,
    onChange,
}: Props) => {
    const { addNotificationText, addNotificationTitle, removeNotificationText } = getNotificationsTexts();

    const noNotificationsButtonClassName = fullWidth ? 'mt0-5 on-mobile-mt1' : 'on-tablet-mt1';

    return (
        <>
            {notifications.map((notification, index) => {
                const uniqueId = index === 0 ? id : `${id}-${index}`;

                return (
                    <div className="mb0-5 flex flex-nowrap flex-align-items-center" key={notification.id}>
                        <NotificationInput
                            id={uniqueId}
                            hasWhen={hasWhen}
                            hasType={hasType}
                            fullWidth={fullWidth}
                            notification={notification}
                            disabled={disabled}
                            onEdit={(newNotification) => onChange(updateItem(notifications, index, newNotification))}
                        />
                        <Tooltip title={removeNotificationText}>
                            <ButtonLike
                                data-test-id="delete-notification"
                                className="flex flex-item-noshrink ml0-5"
                                disabled={disabled}
                                onClick={() => onChange(removeItem(notifications, index))}
                                icon
                                type="button"
                                shape="ghost"
                                color="norm"
                            >
                                <Icon name="trash" className="flex-item-noshrink" />
                                <span className="sr-only">{removeNotificationText}</span>
                            </ButtonLike>
                        </Tooltip>
                    </div>
                );
            })}
            {canAdd && (
                <Button
                    className={clsx([
                        fullWidth ? 'p0' : 'p0-5',
                        notifications.length === 0 && noNotificationsButtonClassName,
                    ])}
                    shape={addIcon ? 'ghost' : 'underline'}
                    color={addIcon ? 'weak' : 'norm'}
                    data-test-id="add-notification"
                    title={addNotificationTitle}
                    disabled={disabled}
                    onClick={() =>
                        onChange(addItem(notifications, { ...defaultNotification, id: generateUID('notification') }))
                    }
                >
                    {addIcon ? (
                        <span className="flex flex-nowrap w100 flex-align-items-center">
                            <Icon name={addIcon} className="mr0-5 flex-item-centered-vert" />
                            {addNotificationText}
                        </span>
                    ) : (
                        addNotificationText
                    )}
                </Button>
            )}
        </>
    );
};

export default Notifications;
