import { Button, CreateNotificationOptions, useNotifications } from '@proton/components';

import mdx from './Notification.mdx';

export default {
    component: Notification,
    title: 'Components / Notification',
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

    return (
        <div>
            <Button color="success" onClick={handleClick({ type: 'success', text: 'You did it!' })} className="mr1">
                Success
            </Button>
            <Button color="info" onClick={handleClick({ type: 'info', text: 'Did you know?' })} className="mr1">
                Info
            </Button>
            <Button color="warning" onClick={handleClick({ type: 'warning', text: 'Careful now!' })} className="mr1">
                Warning
            </Button>
            <Button color="danger" onClick={handleClick({ type: 'error', text: 'Uh oh!' })} className="mr1">
                Error
            </Button>
            <Button
                onClick={handleClick({ type: 'info', text: 'I expire after 5 seconds!', expiration: 5000 })}
                className="mr1"
            >
                Expires after 5 seconds
            </Button>
            <Button onClick={handleClick({ type: 'info', text: 'I expire after 500 milliseconds!', expiration: 500 })}>
                Expires after 500 milliseconds
            </Button>
        </div>
    );
};
