import { Button } from '@proton/atoms';
import generateUID from '@proton/atoms/generateUID';
import getNotificationsTexts from '@proton/components/containers/calendar/notifications/getNotificationsTexts';
import NotificationInputInDrawer from '@proton/components/containers/calendar/notifications/inputs/NotificationInputInDrawer';
import type { NotificationModel } from '@proton/shared/lib/interfaces/calendar/Notification';
import addItem from '@proton/utils/addItem';
import clsx from '@proton/utils/clsx';
import removeItem from '@proton/utils/removeIndex';
import updateItem from '@proton/utils/updateItem';

import type { IconName } from '../../../components';
import { Icon } from '../../../components';

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

const NotificationsInDrawer = ({
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
    const { addNotificationText, addNotificationTitle } = getNotificationsTexts();

    return (
        <>
            {notifications.map((notification, index) => {
                const uniqueId = index === 0 ? id : `${id}-${index}`;

                return (
                    <NotificationInputInDrawer
                        id={uniqueId}
                        hasWhen={hasWhen}
                        hasType={hasType}
                        fullWidth={fullWidth}
                        notification={notification}
                        disabled={disabled}
                        onEdit={(newNotification) => onChange(updateItem(notifications, index, newNotification))}
                        onDelete={() => onChange(removeItem(notifications, index))}
                    />
                );
            })}
            {canAdd && (
                <div className={clsx(['mb-2', notifications.length === 0 && 'mt-2'])}>
                    <Button
                        className="p-0"
                        shape={addIcon ? 'ghost' : 'underline'}
                        color={addIcon ? 'weak' : 'norm'}
                        data-testid="add-notification"
                        title={addNotificationTitle}
                        disabled={disabled}
                        onClick={() =>
                            onChange(
                                addItem(notifications, { ...defaultNotification, id: generateUID('notification') })
                            )
                        }
                    >
                        {addIcon ? (
                            <span className="flex flex-nowrap w-full items-center">
                                <Icon name={addIcon} className="mr-2 self-center my-auto" />
                                {addNotificationText}
                            </span>
                        ) : (
                            addNotificationText
                        )}
                    </Button>
                </div>
            )}
        </>
    );
};

export default NotificationsInDrawer;
