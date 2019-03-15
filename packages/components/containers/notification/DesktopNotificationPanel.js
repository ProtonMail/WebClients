import React, { useState } from 'react';
import { c } from 'ttag';
import Push from 'push.js';
import { Alert, Badge, Button } from 'react-components';

const DesktopNotificationPanel = () => {
    const [status, setStatus] = useState(Push.Permission.get() === Push.Permission.GRANTED);

    const test = () => {
        if (status) {
            Push.create(c('Info').t`You have a new email`, {
                body: 'Quarterly Operations Update - Q1 2016 ',
                icon: '/assets/img/notification-badge.gif',
                onClick() {
                    window.focus();
                }
            });
        }
    };

    const request = async () => {
        try {
            await Push.Permission.request();
            setStatus(true);
        } catch (err) {
            /**
             * Hotfix to fix requesting the permission on non-promisified requests.
             * TypeError: undefined is not an object (evaluating 'this._win.Notification.requestPermission().then')
             * https://github.com/Nickersoft/push.js/issues/117
             */
        }
    };

    if (!status) {
        return (
            <Alert>
                {c('Info').t`Desktop Notifications are currently`} <Badge type="error">{c('Badge').t`Disabled`}</Badge>
                <br />
                <Button onClick={request}>{c('Action').t`Enable desktop notification`}</Button>
            </Alert>
        );
    }

    return (
        <Alert>
            {c('Info').t`Desktop Notifications are currently`} <Badge type="success">{c('Badge').t`Enabled`}</Badge>
            <br />
            <Button onClick={test}>{c('Action').t`Send test notification`}</Button>
        </Alert>
    );
};

export default DesktopNotificationPanel;
