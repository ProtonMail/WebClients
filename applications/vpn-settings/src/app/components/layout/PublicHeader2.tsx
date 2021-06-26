import React from 'react';
import { Href, VpnLogo } from '@proton/components';
import { c } from 'ttag';

interface Props {
    action?: React.ReactNode;
}

const PublicHeader2 = ({ action }: Props) => (
    <header className="flex-item-noshrink flex flex-align-items-center no-print mb2">
        <div className="no-mobile flex-item-fluid">
            <span className="color-weak">{c('Label').t`Back to:`}</span>{' '}
            <Href
                url="https://protonvpn.com"
                className="inline-block text-no-decoration hover-same-color"
                target="_self"
            >{c('Link').t`protonvpn.com`}</Href>
        </div>
        <div className="w150p center">
            <Href url="https://protonvpn.com" target="_self">
                <VpnLogo className="fill-primary" />
            </Href>
        </div>
        <div className="no-mobile flex-item-fluid text-right">{action}</div>
    </header>
);

export default PublicHeader2;
