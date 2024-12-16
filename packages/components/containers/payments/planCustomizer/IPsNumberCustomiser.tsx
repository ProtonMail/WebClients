import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { useFlag } from '@proton/unleash';

import { NumberCustomiser, type NumberCustomiserProps } from './NumberCustomiser';

interface IPsNumberCustomiserProps extends Omit<NumberCustomiserProps, 'label' | 'tooltip'> {}

export const IPsNumberCustomiser = ({ ...rest }: IPsNumberCustomiserProps) => {
    const isIpAddonDowngradeEnabled = useFlag('IpAddonDowngrade');

    return (
        <div>
            <NumberCustomiser
                label={c('Info').t`Dedicated servers`}
                tooltip={c('Info').t`Number of dedicated servers in the organization`}
                {...rest}
            />
            {isIpAddonDowngradeEnabled && (
                <Href href={getKnowledgeBaseUrl('/add-vpn-servers-organization')}>{c('Link').t`Learn more`}</Href>
            )}
        </div>
    );
};
