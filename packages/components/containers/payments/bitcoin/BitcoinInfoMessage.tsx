import type { HTMLAttributes } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { APPS } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { useConfig } from '../../../hooks';

type Props = HTMLAttributes<HTMLDivElement>;

const BitcoinInfoMessage = ({ ...rest }: Props) => {
    const { APP_NAME } = useConfig();

    return (
        <div className="mb-6" {...rest} data-testid="bitcoin-info-message">
            <p className="mb-0">
                {c('Info')
                    .t`Submit a deposit using the following address or scan the QR code. Your deposit will be reflected in your account after confirmation.`}
            </p>
            <Href
                href={
                    APP_NAME === APPS.PROTONVPN_SETTINGS
                        ? 'https://protonvpn.com/support/vpn-bitcoin-payments/'
                        : getKnowledgeBaseUrl('/pay-with-bitcoin')
                }
            >{c('Link').t`How to pay with Bitcoin?`}</Href>
        </div>
    );
};

export default BitcoinInfoMessage;
