import { useState } from 'react';

import type { PushNotification } from 'push.js';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Badge from '@proton/components/components/badge/Badge';
import Field from '@proton/components/components/container/Field';
import { Status, create, getStatus, request } from '@proton/shared/lib/helpers/desktopNotification';

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
            <Field className="pt-2">
                <div className="mb-4">
                    <span className="mr-2">{c('Info').t`Desktop notifications are currently`}</span>
                    {status === Status.GRANTED ? (
                        <Badge type="success" className="m-0">{c('Desktop notification status').t`Enabled`}</Badge>
                    ) : (
                        <Badge type="error" className="m-0">{c('Desktop notification status').t`Disabled`}</Badge>
                    )}
                </div>
                <div>
                    {status === Status.GRANTED ? (
                        <Button size="small" onClick={onTest}>{c('Action').t`Send test notification`}</Button>
                    ) : status === Status.DEFAULT ? (
                        <Button size="small" onClick={handleEnable}>{c('Action')
                            .t`Enable desktop notification`}</Button>
                    ) : null}
                </div>
            </Field>
        </>
    );
};

export default DesktopNotificationPanel;
