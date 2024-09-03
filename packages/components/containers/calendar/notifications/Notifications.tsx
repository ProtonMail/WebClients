import { Button, ButtonLike } from '@proton/atoms';
import getNotificationsTexts from '@proton/components/containers/calendar/notifications/getNotificationsTexts';
import type { NotificationModel } from '@proton/shared/lib/interfaces/calendar/Notification';
import addItem from '@proton/utils/addItem';
import clsx from '@proton/utils/clsx';
import generateUID from '@proton/utils/generateUID';
import removeItem from '@proton/utils/removeIndex';
import updateItem from '@proton/utils/updateItem';

import type { IconName } from '../../../components';
import { Icon, Tooltip } from '../../../components';
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

    const noNotificationsButtonClassName = fullWidth ? 'mt-4 md:mt-2' : 'mt-4 lg:mt-0';

    return (
        <>
            {notifications.map((notification, index) => {
                const uniqueId = index === 0 ? id : `${id}-${index}`;

                return (
                    <div className="mb-2 flex flex-nowrap items-center" key={notification.id}>
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
                                data-testid="delete-notification"
                                className="flex shrink-0 ml-2"
                                disabled={disabled}
                                onClick={() => onChange(removeItem(notifications, index))}
                                icon
                                type="button"
                                shape="ghost"
                                color="norm"
                            >
                                <Icon name="trash" className="shrink-0" />
                                <span className="sr-only">{removeNotificationText}</span>
                            </ButtonLike>
                        </Tooltip>
                    </div>
                );
            })}
            {canAdd && (
                <Button
                    className={clsx([
                        fullWidth ? 'p-0' : 'p-2',
                        notifications.length === 0 && noNotificationsButtonClassName,
                    ])}
                    shape={addIcon ? 'ghost' : 'underline'}
                    color={addIcon ? 'weak' : 'norm'}
                    data-testid="add-notification"
                    title={addNotificationTitle}
                    disabled={disabled}
                    onClick={() =>
                        onChange(addItem(notifications, { ...defaultNotification, id: generateUID('notification') }))
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
            )}
        </>
    );
};

export default Notifications;
