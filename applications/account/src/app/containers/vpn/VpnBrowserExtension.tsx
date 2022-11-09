import { c } from 'ttag';

import { GenericError } from '@proton/components/containers';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';

import Content from '../../public/Content';
import Text from '../../public/Text';
import vpnConnected from './vpn-connected.svg';

interface Props {
    error: string | undefined;
}

const VpnBrowserExtension = ({ error }: Props) => {
    return (
        <div className="p4 on-mobile-p1 text-center">
            {error ? (
                <div>
                    <GenericError>
                        <Text>{error}</Text>
                    </GenericError>
                </div>
            ) : (
                <div>
                    <div className="text-center mt2 mb2">
                        <img className="mauto" src={vpnConnected} />
                    </div>
                    <h1 className="sign-layout-title mt1 mb0 on-mobile-mt0-5">
                        {c('Title').t`Signed in successfully!`}
                    </h1>
                    <Content>
                        <Text>{c('vpn: Info')
                            .t`Open the ${VPN_APP_NAME} browser extension to protect yourself while browsing`}</Text>
                    </Content>
                </div>
            )}
        </div>
    );
};

export default VpnBrowserExtension;
