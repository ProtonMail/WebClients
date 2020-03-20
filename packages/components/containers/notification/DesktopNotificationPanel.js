import React, { useState } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Field, Badge, SmallButton } from 'react-components';
import { create, request, isEnabled } from 'proton-shared/lib/helpers/desktopNotification';

const testDefaultNotification = () => {
    return create(c('Info').t`You have a new email`, {
        body: 'Quarterly operations update',
        icon: '/assets/img/notification-badge.gif',
        onClick() {
            window.focus();
        }
    });
};

const DesktopNotificationPanel = ({ onTest = testDefaultNotification }) => {
    const [status, setStatus] = useState(isEnabled());

    const handleEnable = () => {
        request(
            () => setStatus(true),
            () => setStatus(false)
        );
    };

    return (
        <>
            <Field className="pt0-5">
                <div className="mb1">{c('Info').t`Desktop notifications are currently`}</div>
                <div>
                    {status ? (
                        <SmallButton onClick={onTest}>{c('Action').t`Send test notification`}</SmallButton>
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

DesktopNotificationPanel.propTypes = {
    onTest: PropTypes.func
};

export default DesktopNotificationPanel;
