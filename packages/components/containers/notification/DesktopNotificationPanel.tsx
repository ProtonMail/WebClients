import React, { useState } from 'react';
import { c } from 'ttag';
import { create, getStatus, request, Status } from 'proton-shared/lib/helpers/desktopNotification';
import { PushNotification } from 'push.js';
import { Badge, Field, SmallButton } from '../../components';

const testDefaultNotification = () => {
    return create(c('Info').t`You have a new email`, {
        body: 'Quarterly operations update',
        icon: '/assets/img/notification-badge.gif',
        onClick() {
            window.focus();
        },
    });
};

export interface Props {
    onTest?: () => Promise<PushNotification | undefined>;
    infoURL?: string;
}
const DesktopNotificationPanel = ({ onTest = testDefaultNotification }: Props) => {
    const [status, setStatus] = useState<Status>(getStatus());

    const handleEnable = () => {
        request(
            () => setStatus(getStatus()),
            () => setStatus(getStatus())
        );
    };

    return (
        <>
            <Field className="pt0-5">
                <div className="mb1">
                    <span className="mr0-5">{c('Info').t`Desktop notifications are currently`}</span>
                    {status === Status.GRANTED ? (
                        <Badge type="success" className="m0">{c('Desktop notification status').t`Enabled`}</Badge>
                    ) : (
                        <Badge type="error" className="m0">{c('Desktop notification status').t`Disabled`}</Badge>
                    )}
                </div>
                <div>
                    {status === Status.GRANTED ? (
                        <SmallButton onClick={onTest}>{c('Action').t`Send test notification`}</SmallButton>
                    ) : status === Status.DEFAULT ? (
                        <SmallButton onClick={handleEnable}>{c('Action').t`Enable desktop notification`}</SmallButton>
                    ) : null}
                </div>
            </Field>
        </>
    );
};

export default DesktopNotificationPanel;
