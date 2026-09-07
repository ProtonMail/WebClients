import { Button } from '@proton/atoms/Button/Button';
import type { IconComponent } from '@proton/icons/component';
import type { NotificationModel } from '@proton/shared/lib/interfaces/calendar/Notification';
import addItem from '@proton/utils/addItem';
import clsx from '@proton/utils/clsx';
import generateUID from '@proton/utils/generateUID';
import removeItem from '@proton/utils/removeIndex';
import updateItem from '@proton/utils/updateItem';

import getNotificationsTexts from './getNotificationsTexts';
import NotificationInputInDrawer from './inputs/NotificationInputInDrawer';

interface Props {
    id: string;
    notifications: NotificationModel[];
    hasWhen?: boolean;
    hasType?: boolean;
    fullWidth?: boolean;
    canAdd?: boolean;
    addIcon?: IconComponent;
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
    addIcon: AddIcon,
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
                        shape={AddIcon ? 'ghost' : 'underline'}
                        color={AddIcon ? 'weak' : 'norm'}
                        data-testid="add-notification"
                        title={addNotificationTitle}
                        disabled={disabled}
                        onClick={() =>
                            onChange(
                                addItem(notifications, { ...defaultNotification, id: generateUID('notification') })
                            )
                        }
                    >
                        {AddIcon ? (
                            <span className="flex flex-nowrap w-full items-center">
                                <AddIcon className="mr-2 self-center my-auto" />
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
