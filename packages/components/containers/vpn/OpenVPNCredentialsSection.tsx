import { useState } from 'react';
import { c } from 'ttag';
import { resetVPNSettings } from '@proton/shared/lib/api/vpn';

import { useApi, useLoading, useNotifications, useUserVPN } from '../../hooks';
import { SettingsParagraph, SettingsSectionWide } from '../account';
import { Button, Icon, PrimaryButton, Copy, LearnMore } from '../../components';

import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';

interface Props {
    app?: string;
}

const OpenVPNCredentialsSection = (props: Props) => {
    const [updating, withUpdating] = useLoading();
    const { result = {}, fetch: fetchUserVPN } = useUserVPN();
    const { VPN = {} } = result;
    const { Name = '', Password = '' } = VPN;
    const [show, setShow] = useState(false);
    const api = useApi();
    const { createNotification } = useNotifications();
    const { app } = props;

    const handleResetCredentials = async () => {
        await api(resetVPNSettings());
        await fetchUserVPN();

        createNotification({ text: c('Notification').t`OpenVPN / IKEv2 credentials regenerated` });
    };

    const learnMore = <LearnMore key="learn-more" url="https://protonvpn.com/support/vpn-login/" />;

    return (
        <SettingsSectionWide>
            {app ? (
                <>
                    <SettingsParagraph>
                        {c('Info')
                            .t`You can use the following credentials to connect to a ProtonVPN server using a third-party, open source VPN app, like Tunnelblick for macOS or OpenVPN for GNU/Linux.`}
                    </SettingsParagraph>
                    <SettingsParagraph>
                        {c('Info').t`Learn how to log in to ProtonVPN with third-party VPN applications.`}
                    </SettingsParagraph>
                    <SettingsParagraph>
                        {c('Info').t`We advise you to use official ProtonVPN applications when possible.`}
                    </SettingsParagraph>
                    <SettingsParagraph>
                        {c('Info').jt`
                     You cannot use the OpenVPN / IKEv2 credentials to log in to ProtonVPN applications or the ProtonVPN dashboard. ${learnMore}`}
                    </SettingsParagraph>
                </>
            ) : (
                <>
                    <SettingsParagraph>
                        {c('Info')
                            .t`Use the following credentials when connecting to ProtonVPN servers without application. Examples use cases include: Tunnelblick on macOS, OpenVPN on GNU/Linux.`}
                    </SettingsParagraph>
                    <SettingsParagraph>
                        {c('Info').jt`
                    Do not use the OpenVPN / IKEv2 credentials in ProtonVPN applications or on the ProtonVPN dashboard. ${learnMore}`}
                    </SettingsParagraph>
                </>
            )}

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

export default OpenVPNCredentialsSection;
