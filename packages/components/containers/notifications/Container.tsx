import Notification from './Notification';
import { NotificationOptions } from './interfaces';

interface Props {
    notifications: NotificationOptions[];
    removeNotification: (id: number) => void;
    hideNotification: (id: number) => void;
}
const NotificationsContainer = ({ notifications, removeNotification, hideNotification }: Props) => {
    const list = notifications.map(({ id, key, type, text, isClosing, disableAutoClose }) => {
        return (
            <Notification
                key={key}
                isClosing={isClosing}
                type={type}
                onClick={disableAutoClose ? undefined : () => hideNotification(id)}
                onExit={() => removeNotification(id)}
            >
                {text}
            </Notification>
        );
    });

    return <div className="notifications-container flex flex-column flex-align-items-center">{list}</div>;
};

export default NotificationsContainer;
