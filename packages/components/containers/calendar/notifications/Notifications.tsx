import { c } from 'ttag';

import { NotificationModel } from '@proton/shared/lib/interfaces/calendar/Notification';
import addItem from '@proton/utils/addItem';
import removeItem from '@proton/utils/removeIndex';
import updateItem from '@proton/utils/updateItem';

import { Button, ButtonLike, Icon, IconName, Tooltip } from '../../../components';
import { classnames, generateUID } from '../../../helpers';
import { useActiveBreakpoint } from '../../../hooks';
import NotificationInput from './inputs/NotificationInput';

export const NOTIFICATION_ID = 'notifications';

interface Props {
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
    const { isNarrow } = useActiveBreakpoint();
    const addNotificationText = c('Action').t`Add notification`;

    const noNotificationsButtonClassName = fullWidth ? 'mt0-5 on-mobile-mt1' : 'mt0-5 on-tablet-mt1';

    return (
        <>
            {notifications.map((notification, index) => {
                return (
                    <div className="mb0-5 flex flex-nowrap flex-align-items-center" key={notification.id}>
                        <NotificationInput
                            hasWhen={hasWhen}
                            hasType={hasType}
                            fullWidth={fullWidth}
                            notification={notification}
                            disabled={disabled}
                            onChange={(newNotification) => onChange(updateItem(notifications, index, newNotification))}
                            isNarrow={isNarrow}
                        />
                        <Tooltip title={c('Action').t`Remove this notification`}>
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
                                <span className="sr-only">{c('Action').t`Remove this notification`}</span>
                            </ButtonLike>
                        </Tooltip>
                    </div>
                );
            })}
            {canAdd && (
                <Button
                    className={classnames(['p0-5', notifications.length === 0 && noNotificationsButtonClassName])}
                    shape={addIcon ? 'ghost' : 'underline'}
                    color={addIcon ? 'weak' : 'norm'}
                    data-test-id="add-notification"
                    title={c('Title').t`Add another notification to remind you of this event`}
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
