import { c } from 'ttag';
import { NotificationModel } from '@proton/shared/lib/interfaces/calendar/Notification';
import { EventModelErrors } from '@proton/shared/lib/interfaces/calendar';
import { addItem, updateItem } from '@proton/utils/array';
import removeItem from '@proton/utils/removeIndex';
import { classnames, generateUID } from '../../../helpers';
import { ButtonLike, ErrorZone, Icon, UnderlineButton, Tooltip } from '../../../components';
import NotificationInput from './inputs/NotificationInput';
import { useActiveBreakpoint } from '../../../hooks';

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
    const { isNarrow } = useActiveBreakpoint();

    return (
        <>
            {notifications.map((notification, index) => {
                return (
                    <div className="mb0-5 flex flex-nowrap flex-align-items-center" key={notification.id}>
                        <NotificationInput
                            hasWhen={hasWhen}
                            hasType={hasType}
                            notification={notification}
                            onChange={(newNotification) => onChange(updateItem(notifications, index, newNotification))}
                            error={errors?.notifications?.fields.includes(index) ? '' : undefined}
                            isNarrow={isNarrow}
                        />
                        <Tooltip title={c('Action').t`Remove this notification`}>
                            <ButtonLike
                                data-test-id="delete-notification"
                                className="flex flex-item-noshrink ml0-5"
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
                <UnderlineButton
                    className={classnames(['p0', notifications.length === 0 && 'mt0-5 on-mobile-mt1'])}
                    data-test-id="add-notification"
                    title={c('Title').t`Add another notification to remind you of this event`}
                    onClick={() =>
                        onChange(addItem(notifications, { ...defaultNotification, id: generateUID('notification') }))
                    }
                >
                    {c('Action').t`Add notification`}
                </UnderlineButton>
            )}
            {errors?.notifications?.text && <ErrorZone id={NOTIFICATION_ID}>{errors.notifications.text}</ErrorZone>}
        </>
    );
};

export default Notifications;
