import React, { useState } from 'react';
import { c } from 'ttag';

import { resetVPNSettings } from 'proton-shared/lib/api/vpn';
import { Alert, Copy, PrimaryButton, Button, Icon } from '../../../components';
import { useUserVPN, useApi, useNotifications, useLoading } from '../../../hooks';

const OpenVPNAccountSection = () => {
    const [updating, withUpdating] = useLoading();
    const { result = {}, fetch: fetchUserVPN } = useUserVPN();
    const { VPN = {} } = result;
    const { Name = '', Password = '' } = VPN;
    const [show, setShow] = useState(false);
    const api = useApi();
    const { createNotification } = useNotifications();

    const handleResetCredentials = async () => {
        await api(resetVPNSettings());
        await fetchUserVPN();

        createNotification({ text: c('Notification').t`OpenVPN / IKEv2 credentials regenerated` });
    };

    return (
        <>
            <Alert learnMore="https://protonvpn.com/support/vpn-login/">
                {c('Info')
                    .t`Use the following credentials when connecting to ProtonVPN servers without application. Examples use cases include: Tunnelblick on macOS, OpenVPN on GNU/Linux.
                    Do not use the OpenVPN / IKEv2 credentials in ProtonVPN applications or on the ProtonVPN dashboard.`}
            </Alert>
            <div className="flex flex-align-items-center mb1 on-mobile-flex-column">
                <span className="label pt0">{c('Label').t`OpenVPN / IKEv2 username`}</span>
                <div className="text-ellipsis max-w100 mr1 on-mobile-mr0">
                    <code title={Name}>{Name}</code>
                </div>
                <div className="flex flex-item-noshrink on-mobile-mt0-5">
                    <Copy value={Name} />
                </div>
            </div>
            <div className="flex flex-align-items-center mb1 on-mobile-flex-column">
                <span className="label pt0">{c('Label').t`OpenVPN / IKEv2 password`}</span>
                <div className="text-ellipsis max-w100 mr1 on-mobile-mr0">
                    <code>{show ? Password : '••••••••••••••••'}</code>
                </div>
                <div className="flex flex-item-noshrink on-mobile-mt0-5">
                    <Copy className="mr1" value={Password} />
                    <Button
                        icon
                        onClick={() => setShow(!show)}
                        title={show ? c('Action').t`Hide` : c('Action').t`Show`}
                    >
                        <Icon name={show ? 'unread' : 'read'} />
                    </Button>
                </div>
            </div>
            <PrimaryButton
                disabled={!Name || !Password}
                loading={updating}
                onClick={() => withUpdating(handleResetCredentials())}
            >{c('Action').t`Reset credentials`}</PrimaryButton>
        </>
    );
};

export default OpenVPNAccountSection;
