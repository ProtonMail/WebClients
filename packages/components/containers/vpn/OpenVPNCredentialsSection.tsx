import { useState } from 'react';

import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import { useLoading } from '@proton/hooks';
import { resetVPNSettings } from '@proton/shared/lib/api/vpn';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';

import { Copy, PrimaryButton } from '../../components';
import { useApi, useNotifications, useUserVPN } from '../../hooks';
import { SettingsParagraph, SettingsSectionWide } from '../account';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';

interface Props {
    app?: string;
}

const OpenVPNCredentialsSection = (props: Props) => {
    const [updating, withUpdating] = useLoading();
    const { result = {}, fetch: fetchUserVPN } = useUserVPN();
    const { VPN = {} } = result as any;
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

    const learnMore = (
        <Href key="learn-more" href="https://protonvpn.com/support/vpn-login/">{c('Link').t`Learn more`}</Href>
    );

    return (
        <SettingsSectionWide>
            {app ? (
                <>
                    <SettingsParagraph>
                        {c('Info')
                            .t`You can use the following credentials to connect to a ${VPN_APP_NAME} server using a third-party, open source VPN app, like Tunnelblick for macOS or OpenVPN for GNU/Linux.`}
                    </SettingsParagraph>
                    <SettingsParagraph>
                        {c('Info').t`Learn how to sign in to ${VPN_APP_NAME} with third-party VPN applications.`}
                    </SettingsParagraph>
                    <SettingsParagraph>
                        {c('Info').t`We advise you to use official ${VPN_APP_NAME} applications when possible.`}
                    </SettingsParagraph>
                    <SettingsParagraph>
                        {c('Info')
                            .jt`These credentials cannot be used to sign in to our official ${VPN_APP_NAME} apps. ${learnMore}`}
                    </SettingsParagraph>
                </>
            ) : (
                <>
                    <SettingsParagraph>
                        {c('Info')
                            .t`Use the following credentials when connecting to ${VPN_APP_NAME} servers without application. Example use cases include: Tunnelblick on macOS, OpenVPN on GNU/Linux.`}
                    </SettingsParagraph>
                    <SettingsParagraph>
                        {c('Info')
                            .jt`These credentials cannot be used to sign in to our official ${VPN_APP_NAME} apps. ${learnMore}`}
                    </SettingsParagraph>
                </>
            )}

            <SettingsLayout>
                <SettingsLayoutLeft>
                    <span className="label pt-0">{c('Label').t`OpenVPN / IKEv2 username`}</span>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="flex items-center">
                    <div className="text-ellipsis max-w-full mr-0 md:mr-4">
                        <code title={Name}>{Name}</code>
                    </div>
                    <div className="flex shrink-0 mt-2 md:mt-0">
                        <Copy
                            value={Name}
                            onCopy={() => {
                                createNotification({
                                    text: c('Success').t`Username copied to clipboard`,
                                });
                            }}
                        />
                    </div>
                </SettingsLayoutRight>
            </SettingsLayout>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <span className="label pt-0">{c('Label').t`OpenVPN / IKEv2 password`}</span>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="flex items-center">
                    <div className="text-ellipsis max-w-full mr-0 md:mr-4">
                        <code>{show ? Password : '••••••••••••••••'}</code>
                    </div>
                    <div className="flex shrink-0 mt-2 md:mt-0">
                        <Copy
                            className="mr-4"
                            value={Password}
                            onCopy={() => {
                                createNotification({
                                    text: c('Success').t`Password copied to clipboard`,
                                });
                            }}
                        />
                        <Button
                            icon
                            onClick={() => setShow(!show)}
                            title={show ? c('Action').t`Hide` : c('Action').t`Show`}
                        >
                            <Icon
                                name={show ? 'eye-slash' : 'eye'}
                                alt={show ? c('Action').t`Hide` : c('Action').t`Show`}
                            />
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
