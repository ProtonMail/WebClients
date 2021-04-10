import React, { useState } from 'react';
import { c } from 'ttag';

import { resetVPNSettings } from 'proton-shared/lib/api/vpn';
import {
    Copy,
    PrimaryButton,
    Button,
    Icon,
    useUserVPN,
    useApi,
    useNotifications,
    useLoading,
    SettingsParagraph,
    SettingsSectionWide,
} from 'react-components';
import SettingsLayout from 'react-components/containers/account/SettingsLayout';
import SettingsLayoutLeft from 'react-components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from 'react-components/containers/account/SettingsLayoutRight';

const OpenVPNCredentialSection = () => {
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
        <SettingsSectionWide>
            <SettingsParagraph>
                {c('Info')
                    .t`Use the following credentials when connecting to ProtonVPN servers without application. Examples use cases include: Tunnelblick on macOS, OpenVPN on GNU/Linux.
                    Do not use the OpenVPN / IKEv2 credentials in ProtonVPN applications or on the ProtonVPN dashboard.`}
            </SettingsParagraph>
            <SettingsParagraph>
                {c('Info').t`
                    Do not use the OpenVPN / IKEv2 credentials in ProtonVPN applications or on the ProtonVPN dashboard.`}
            </SettingsParagraph>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <span className="label pt0">{c('Label').t`OpenVPN / IKEv2 username`}</span>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="flex flex-align-items-center">
                    <div className="text-ellipsis max-w100 mr1 on-mobile-mr0">
                        <code title={Name}>{Name}</code>
                    </div>
                    <div className="flex flex-item-noshrink on-mobile-mt0-5">
                        <Copy value={Name} />
                    </div>
                </SettingsLayoutRight>
            </SettingsLayout>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <span className="label pt0">{c('Label').t`OpenVPN / IKEv2 password`}</span>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="flex flex-align-items-center">
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
                </SettingsLayoutRight>
            </SettingsLayout>
            <PrimaryButton
                disabled={!Name || !Password}
                loading={updating}
                onClick={() => withUpdating(handleResetCredentials())}
            >{c('Action').t`Reset credentials`}</PrimaryButton>
        </SettingsSectionWide>
    );
};

export default OpenVPNCredentialSection;
