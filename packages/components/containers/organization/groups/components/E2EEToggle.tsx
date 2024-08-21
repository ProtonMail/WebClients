import { useState } from 'react';

import { c } from 'ttag';

import useLoading from '@proton/hooks/useLoading';
import { KEY_FLAG } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import type { Address } from '@proton/shared/lib/interfaces';

import { Toggle } from '../../../../components/';
import useGroupCrypto from '../useGroupCrypto';

interface Props {
    address: Address;
}

const E2EEToggle = ({ address }: Props) => {
    const { disableEncryption, enableEncryption } = useGroupCrypto();
    const [toggleLoading, withToggleLoading] = useLoading();
    const initialIsE2EEEnabled =
        address?.Keys?.length > 0 && !hasBit(address.Keys[0].Flags, KEY_FLAG.FLAG_EMAIL_NO_ENCRYPT);
    const [groupAddressE2EEEnabled, setGroupAddressE2EEEnabled] = useState<boolean>(initialIsE2EEEnabled);

    const handleE2EEToggle = async () => {
        try {
            const toggleAction = groupAddressE2EEEnabled ? disableEncryption : enableEncryption;
            await withToggleLoading(toggleAction(address));
            setGroupAddressE2EEEnabled(!groupAddressE2EEEnabled);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="flex flex-nowrap items-center mt-4">
            <Toggle
                id="group-e2ee-toggle"
                onChange={handleE2EEToggle}
                checked={groupAddressE2EEEnabled}
                loading={toggleLoading}
            />
            <h3 className="flex-1 text-rg ml-2">
                <label htmlFor="group-e2ee-toggle">{c('Action')
                    .t`Allow end-to-end encrypted mail for this group`}</label>
            </h3>
        </div>
    );
};

export default E2EEToggle;
