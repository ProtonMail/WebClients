import { c } from 'ttag';

import {
    disableGroupAddressEncryption,
    enableGroupAddressEncryption,
} from '@proton/account/groups/setGroupAddressFlags';
import Toggle from '@proton/components/components/toggle/Toggle';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { KEY_FLAG } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import type { Address, Group } from '@proton/shared/lib/interfaces';

import type { GroupsManagementReturn } from '../types';

interface Props {
    group: Group;
    groupsManagement: GroupsManagementReturn;
}

const E2EEToggle = ({ group, groupsManagement }: Props) => {
    const groupAddressID = group.Address.ID;
    const address = groupsManagement.groups.find(({ Address: { ID } }) => ID === groupAddressID)?.Address;
    const { createNotification } = useNotifications();
    const handleError = useErrorHandler();

    const primaryGroupAddressKey = address?.Keys[0];
    const isE2EEEnabled = !hasBit(primaryGroupAddressKey?.Flags ?? 0, KEY_FLAG.FLAG_EMAIL_NO_ENCRYPT);

    const [toggleLoading, withToggleLoading] = useLoading();

    const dispatch = useDispatch();

    const disableEncryption = async (groupAddress: Address) => {
        await dispatch(disableGroupAddressEncryption({ groupAddress }));
        createNotification({ text: c('Success notification').t`Group end-to-end email encryption disabled` });
    };

    const enableEncryption = async (groupAddress: Address) => {
        await dispatch(enableGroupAddressEncryption({ groupAddress }));
        createNotification({ text: c('Success notification').t`Group end-to-end email encryption enabled` });
    };

    const handleE2EEToggle = async () => {
        if (!address) {
            throw new Error('Missing group address');
        }
        try {
            const toggleAction = isE2EEEnabled ? disableEncryption : enableEncryption;
            await withToggleLoading(toggleAction(address));
        } catch (error) {
            handleError(error);
        }
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
