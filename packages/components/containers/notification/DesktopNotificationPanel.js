import React, { useState } from 'react';
import { c } from 'ttag';
import { Field, Badge, SmallButton } from 'react-components';
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
        <>
            <Field className="pt0-5">
                <div className="mb1">{c('Info').t`Desktop notifications are currently`}</div>
                <div>
                    {status ? (
                        <SmallButton onClick={handleTest}>{c('Action').t`Send test notification`}</SmallButton>
                    ) : (
                        <SmallButton onClick={handleEnable}>{c('Action').t`Enable desktop notification`}</SmallButton>
                    )}
                </div>
            </Field>
            <div className="ml1 pt0-5">
                {status ? (
                    <Badge type="success">{c('Desktop notification status').t`Enabled`}</Badge>
                ) : (
                    <Badge type="error">{c('Desktop notification status').t`Disabled`}</Badge>
                )}
            </div>
        </>
    );
};

export default DesktopNotificationPanel;
