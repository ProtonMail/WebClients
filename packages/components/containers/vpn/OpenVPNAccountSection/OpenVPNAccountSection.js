import React, { useState, useEffect } from 'react';
import {
    SubTitle,
    Alert,
    Row,
    Field,
    Input,
    Label,
    Copy,
    PrimaryButton,
    PasswordInput,
    useUserVPN
} from 'react-components';
import { c } from 'ttag';
import useApiWithoutResult from '../../../hooks/useApiWithoutResult';
import { updateVPNName, updateVPNPassword } from 'proton-shared/lib/api/vpn';
import useNotifications from '../../notifications/useNotifications';

const OpenVPNAccountSection = () => {
    const { createNotification } = useNotifications();
    const { result, fetch: fetchUserVPN } = useUserVPN();
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const { loading: loadingUsername, request: updateUsername } = useApiWithoutResult(updateVPNName);
    const { loading: loadingPassword, request: updatePassword } = useApiWithoutResult(updateVPNPassword);

    // VPN Info might not have been loaded yet
    useEffect(() => {
        if (result && result.VPN) {
            setCredentials({
                username: result.VPN.Name,
                password: result.VPN.Password
            });
        }
    }, [result]);

    const { username, password } = credentials;

    const handleChangeUsername = ({ target }) => setCredentials((prev) => ({ ...prev, username: target.value }));
    const handleChangePassword = ({ target }) => setCredentials((prev) => ({ ...prev, password: target.value }));

    const handleUpdateUsername = async () => {
        await updateUsername(credentials.username);
        createNotification({ text: c('Notification').t`OpenVPN username updated` });
        fetchUserVPN();
    };
    const handleUpdatePassword = async () => {
        await updatePassword(credentials.password);
        createNotification({ text: c('Notification').t`OpenVPN password updated` });
        fetchUserVPN();
    };

    return (
        <>
            <SubTitle>{c('Title').t`OpenVPN / IKEv2 username`}</SubTitle>
            <Alert learnMore="https://protonvpn.com/support/vpn-login/">
                {c('Info')
                    .t`Use the following credentials when connecting to ProtonVPN servers without application. Examples use cases include: Tunnelblick on MacOS, OpenVPN on GNU/Linux.
                    Do not use the OpenVPN / IKEv2 credentials in ProtonVPN applications or on the ProtonVPN dashboard.`}
            </Alert>
            <Row className="mb1-5">
                <Label htmlFor="openvpn-username">{c('Label').t`OpenVPN / IKEv2 username`}</Label>
                <Field>
                    <div className="mb0-5">
                        <Input id="openvpn-username" value={username} onChange={handleChangeUsername} />
                    </div>
                    <div>
                        <PrimaryButton
                            disabled={!credentials || !credentials.username}
                            loading={loadingUsername}
                            onClick={handleUpdateUsername}
                        >{c('Action').t`Change username`}</PrimaryButton>
                    </div>
                </Field>
                <div className="ml1">
                    <Copy value={username} />
                </div>
            </Row>
            <Row>
                <Label htmlFor="openvpn-password">{c('Label').t`OpenVPN / IKEv2 password`}</Label>
                <Field>
                    <div className="mb0-5">
                        <PasswordInput id="openvpn-password" value={password} onChange={handleChangePassword} />
                    </div>
                    <div>
                        <PrimaryButton
                            disabled={!credentials || !credentials.password}
                            loading={loadingPassword}
                            onClick={handleUpdatePassword}
                        >{c('Action').t`Change password`}</PrimaryButton>
                    </div>
                </Field>
                <div className="ml1">
                    <Copy value={password} />
                </div>
            </Row>
        </>
    );
};

export default OpenVPNAccountSection;
