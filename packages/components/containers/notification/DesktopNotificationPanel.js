import React, { useState } from 'react';
import { c } from 'ttag';
import Push from 'push.js';
import { Block, Badge, SmallButton } from 'react-components';

const DesktopNotificationPanel = () => {
    const [status, setStatus] = useState(Push.Permission.get() === Push.Permission.GRANTED);

    const test = () => {
        if (status) {
            Push.create(c('Info').t`You have a new email`, {
                body: 'Quarterly operations update - Q1 2016 ',
                icon: '/assets/img/notification-badge.gif',
                onClick() {
                    window.focus();
                }
            });
        }
    };

    const request = async () => {
        try {
            Push.Permission.request(
                () => {
                    setStatus(true);
                },
                () => {
                    setStatus(false);
                }
            );
        } catch (err) {
            /**
             * Hotfix to fix requesting the permission on non-promisified requests.
             * TypeError: undefined is not an object (evaluating 'this._win.Notification.requestPermission().then')
             * https://github.com/Nickersoft/push.js/issues/117
             */
        }
    };

    return (
        <Block>
            <Block>
                <span className="mr1">{c('Info').t`Desktop notifications are currently`}</span>
                {status ? (
                    <Badge type="success">{c('Badge').t`Enabled`}</Badge>
                ) : (
                    <Badge type="error">{c('Badge').t`Disabled`}</Badge>
                )}
            </Block>
            {status ? (
                <SmallButton onClick={test}>{c('Action').t`Send test notification`}</SmallButton>
            ) : (
                <SmallButton onClick={request}>{c('Action').t`Enable desktop notification`}</SmallButton>
            )}
        </Block>
    );
};

export default DesktopNotificationPanel;
