import { Button } from '@proton/atoms';
import { CreateNotificationOptions, NotificationButton, useNotifications } from '@proton/components';

import { getTitle } from '../../helpers/title';
import mdx from './Notification.mdx';

export default {
    component: Notification,
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => {
    const { createNotification } = useNotifications();

    const handleClick = (options: CreateNotificationOptions) => () => {
        createNotification(options);
    };

    const defaultWithAction = (
        <>
            <span>I've done the thing</span>
            <NotificationButton onClick={undefined}>Undo</NotificationButton>
        </>
    );

    const warningWithAction = (
        <>
            <span>Oh no, not again</span>
            <NotificationButton notificationType="warning" onClick={undefined}>
                Edit
            </NotificationButton>
        </>
    );

    return (
        <div>
            <Button
                color="success"
                onClick={handleClick({
                    type: 'success',
                    text: 'You did it',
                })}
                className="mr1 mb1"
            >
                Default notification
            </Button>
            <Button color="info" onClick={handleClick({ type: 'info', text: defaultWithAction })} className="mr1 mb1">
                Default with action
            </Button>
            <Button
                color="info"
                onClick={handleClick({ type: 'info', text: 'whoop', showCloseButton: false })}
                className="mr1 mb1"
            >
                Default without close button
            </Button>
            <Button
                color="info"
                onClick={handleClick({ type: 'info', text: defaultWithAction, showCloseButton: false })}
                className="mr1 mb1"
            >
                Default without close button but with an action
            </Button>

            <Button
                color="warning"
                onClick={handleClick({
                    type: 'warning',
                    text: 'Uh oh',
                })}
                className="mr1 mb1"
            >
                Default warning
            </Button>
            <Button
                color="warning"
                onClick={handleClick({ type: 'warning', text: warningWithAction })}
                className="mr1 mb1"
            >
                Warning with action
            </Button>
            <Button
                color="warning"
                onClick={handleClick({ type: 'warning', text: 'Dammit', showCloseButton: false })}
                className="mr1 mb1"
            >
                Warning without close button
            </Button>
            <Button
                color="warning"
                onClick={handleClick({ type: 'warning', text: warningWithAction, showCloseButton: false })}
                className="mr1 mb1"
            >
                Warning without close button but with an action
            </Button>
            <Button
                color="warning"
                onClick={handleClick({ type: 'warning', text: 'Surprise icon', icon: 'credit-card' })}
                className="mr1 mb1"
            >
                Warning with different icon
            </Button>
        </div>
    );
};

export const Expiration = () => {
    const { createNotification } = useNotifications();

    const handleClick = (options: CreateNotificationOptions) => () => {
        createNotification(options);
    };

    return (
        <div>
            <Button
                onClick={handleClick({ type: 'info', text: 'I expire after 5 seconds!', expiration: 5000 })}
                className="mr1 mb1"
            >
                Expires after 5 seconds
            </Button>
            <Button
                onClick={handleClick({ type: 'info', text: 'I expire after 500 milliseconds!', expiration: 500 })}
                className="mr1 mb1"
            >
                Expires after 500 milliseconds
            </Button>
        </div>
    );
};
