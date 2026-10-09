import { c } from 'ttag';

import { ADDRESS_STATUS, ADDRESS_TYPE, BRAND_NAME } from '@proton/shared/lib/constants';
import { getIsBYOEAddress } from '@proton/shared/lib/helpers/address';
import type { Address } from '@proton/shared/lib/interfaces';

import Info from '../../components/link/Info';

interface Props {
    address: Address;
}

const ExternalAddressInfo = ({ address }: Props) => {
    // A disabled address can't be used to sign in either
    if (
        address.Type !== ADDRESS_TYPE.TYPE_EXTERNAL ||
        getIsBYOEAddress(address) ||
        address.Status !== ADDRESS_STATUS.STATUS_ENABLED
    ) {
        return;
    }

    return (
        <div className="flex items-center">
            <span className="color-weak text-sm">{c('Info').t`Sign in only`}</span>
            <Info
                className="ml-1 color-weak"
                title={c('Tooltip').t`This email address can only be used to sign in to your ${BRAND_NAME} account.`}
            />
        </div>
    );
};

export default ExternalAddressInfo;
