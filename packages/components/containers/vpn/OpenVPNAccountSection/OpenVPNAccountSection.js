import React from 'react';
import { SubTitle, Alert, Row, Field, Label, Copy, PrimaryButton, useUserVPN, useModals } from 'react-components';
import { c } from 'ttag';

import OpenVPNCredentialsModal from './OpenVPNCredentialsModal';

const OpenVPNAccountSection = () => {
    const { createModal } = useModals();
    const { result = {}, fetch: fetchUserVPN } = useUserVPN();
    const { VPN = {} } = result;
    const { username = '', password = '' } = VPN;

    const handleEditCredentials = () => {
        createModal(<OpenVPNCredentialsModal username={username} password={password} fetchUserVPN={fetchUserVPN} />);
    };

    return (
        <>
            <SubTitle>{c('Title').t`OpenVPN / IKEv2 username`}</SubTitle>
            <Alert learnMore="https://protonvpn.com/support/vpn-login/">
                {c('Info')
                    .t`Use the following credentials when connecting to ProtonVPN servers without application. Examples use cases include: Tunnelblick on MacOS, OpenVPN on GNU/Linux.
                    Do not use the OpenVPN / IKEv2 credentials in ProtonVPN applications or on the ProtonVPN dashboard.`}
            </Alert>
            <Row>
                <Label>{c('Label').t`OpenVPN / IKEv2 username`}</Label>
                <Field>
                    <div className="pt0-5">
                        <strong>{username}</strong>
                    </div>
                </Field>
                <div className="ml1 flex-item-noshrink onmobile-ml0 onmobile-mt0-5">
                    <Copy value={username} />
                </div>
            </Row>
            <Row>
                <Label>{c('Label').t`OpenVPN / IKEv2 password`}</Label>
                <Field>
                    <div className="mb1 pt0-5">
                        <strong>{password}</strong>
                    </div>
                    <PrimaryButton disabled={!username || !password} onClick={handleEditCredentials}>{c('Action')
                        .t`Edit credentials`}</PrimaryButton>
                </Field>
                <div className="ml1 flex-item-noshrink onmobile-ml0 onmobile-mt0-5">
                    <Copy value={password} />
                </div>
            </Row>
        </>
    );
};

export default OpenVPNAccountSection;
