import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import useLoading from '@proton/hooks/useLoading';
import { KEY_FLAG } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import type { Group } from '@proton/shared/lib/interfaces';

import type { GroupsManagementReturn } from '../types';
import useGroupCrypto from '../useGroupCrypto';

interface Props {
    group: Group;
    groupsManagement: GroupsManagementReturn;
}

const E2EEToggle = ({ group, groupsManagement }: Props) => {
    const groupAddressID = group.Address.ID;
    const address = groupsManagement.groups.find(({ Address: { ID } }) => ID === groupAddressID)?.Address;

    const primaryGroupAddressKey = address?.Keys[0];
    const isE2EEEnabled = !hasBit(primaryGroupAddressKey?.Flags ?? 0, KEY_FLAG.FLAG_EMAIL_NO_ENCRYPT);

    const { disableEncryption, enableEncryption } = useGroupCrypto();
    const [toggleLoading, withToggleLoading] = useLoading();

    const handleE2EEToggle = async () => {
        if (!address) {
            throw new Error('Missing group address');
        }
        try {
            const toggleAction = isE2EEEnabled ? disableEncryption : enableEncryption;
            await withToggleLoading(toggleAction(address));
        } catch (error) {}
    };

    return (
        <div className="flex flex-nowrap items-center mt-4">
            <Toggle
                id="group-e2ee-toggle"
                onChange={handleE2EEToggle}
                checked={isE2EEEnabled}
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
