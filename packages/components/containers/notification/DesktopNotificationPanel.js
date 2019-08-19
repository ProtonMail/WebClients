import React, { useState } from 'react';
import { c } from 'ttag';
import { Block, Badge, SmallButton } from 'react-components';
import { create, request, isEnabled } from 'proton-shared/lib/helpers/desktopNotification';

const DesktopNotificationPanel = () => {
    const [status, setStatus] = useState(isEnabled());

    const handleTest = () => {
        if (status) {
            create(c('Info').t`You have a new email`, {
                body: 'Quarterly operations update - Q1 2016 ',
                icon: '/assets/img/notification-badge.gif',
                onClick() {
                    window.focus();
                }
            });
        }
    };

    const handleEnable = () => {
        request(() => setStatus(true), () => setStatus(false));
    };

    return (
        <Block>
            <Block>
                <span className="mr0-5">{c('Info').t`Desktop notifications are currently`}</span>
                {status ? (
                    <Badge type="success">{c('Desktop notification status').t`Enabled`}</Badge>
                ) : (
                    <Badge type="error">{c('Desktop notification status').t`Disabled`}</Badge>
                )}
            </Block>
            {status ? (
                <SmallButton onClick={handleTest}>{c('Action').t`Send test notification`}</SmallButton>
            ) : (
                <SmallButton onClick={handleEnable}>{c('Action').t`Enable desktop notification`}</SmallButton>
            )}
        </Block>
    );
};

export default DesktopNotificationPanel;
