import React from 'react';
import { c } from 'ttag';
import { Alert, SubTitle, Href, Block } from 'react-components';

const ProtonVPNAppsSection = () => {
    return (
        <>
            <SubTitle>ProtonVPN apps</SubTitle>
            <Alert learnMore="https://protonvpn.com/support/">{c('Info')
                .t`Go to the download page to get ProtonVPN. You can use you ProtonMail credentials to the log into the ProtonVPN native clients.`}</Alert>
            <Block>
                <Href url="https://protonvpn.com/download/">{c('Link').t`Download page`}</Href>
            </Block>
            <Alert learnMore="https://protonvpn.com/support/vpn-login/">{c('Info')
                .t`To connect to ProtonVPN with third party clients (e.g. Tunnelblick on MacOS or OopenVPN on GNU/Linux), you need specific credentials. to get these credentials, go to the Account settings when logged in at ProtonVPN.`}</Alert>
            <Block>
                <Href url="https://account.protonvpn.com">{c('Link').t`ProtonVPN login`}</Href>
            </Block>
        </>
    );
};

export default ProtonVPNAppsSection;
