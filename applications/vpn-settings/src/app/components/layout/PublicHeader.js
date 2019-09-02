import React from 'react';
import { Href, VpnLogo, Icon } from 'react-components';
import { c } from 'ttag';

const PublicHeader = () => (
    <>
        <div className="flex flex-items-center flex-justify-start onmobile-flex-column pt1 pb1 bg-global-grey">
            <div className="flex-item-fluid">
                <div className="mw80 center">
                    <Href className="color-white nodecoration" url="https://protonvpn.com" target="_self">
                        <Icon name="caret" color="white" rotate={90} />
                        {c('Link').t`Return to protonvpn.com`}
                    </Href>
                </div>
            </div>
        </div>
        <div className="redeem-header-wrapper pt1 pb1 bg-global-grey">
            <div className="mw80 center">
                <header className="header flex flex-items-center flex-nowrap reset4print">
                    <VpnLogo url="/account" />
                </header>
            </div>
        </div>
    </>
);

export default PublicHeader;
