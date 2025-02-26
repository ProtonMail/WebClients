import { c } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';
import Loader from '@proton/components/components/loader/Loader';
import { KEY_FLAG } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import type { Group, GroupMember } from '@proton/shared/lib/interfaces';
import { GROUP_MEMBER_TYPE } from '@proton/shared/lib/interfaces';

import type { NewGroupMember } from './EditGroup';
import type { GroupsManagementReturn } from './types';

const E2EEDisabledWarning = ({
    groupMembers,
    loadingGroupMembers,
    group,
    groupsManagement,
    newGroupMembers = [],
}: {
    groupMembers: GroupMember[];
    loadingGroupMembers: boolean;
    group?: Group;
    groupsManagement: GroupsManagementReturn;
    newGroupMembers?: NewGroupMember[];
}) => {
    const groupAddressID = group?.Address.ID;
    const groupAddress = groupsManagement.groups.find(({ Address: { ID } }) => ID === groupAddressID)?.Address;

    if (loadingGroupMembers) {
        return <Loader />;
    }

    let isE2EEEnabled;

    const newGroupMembersHasExternal = newGroupMembers.some(
        ({ GroupMemberType }) => GroupMemberType !== GROUP_MEMBER_TYPE.INTERNAL
    );

    if (groupAddress !== undefined) {
        const primaryGroupAddressKey = groupAddress.Keys[0];
        isE2EEEnabled = !hasBit(primaryGroupAddressKey?.Flags ?? 0, KEY_FLAG.FLAG_EMAIL_NO_ENCRYPT);
    } else {
        // group doesn't exist, so we're creating a new one
        isE2EEEnabled = !newGroupMembersHasExternal;
    }

    const groupMembersHasExternal = groupMembers.some(({ Type }) => Type !== GROUP_MEMBER_TYPE.INTERNAL);

    const isDisabledDueToExternalAddresses = groupMembersHasExternal || newGroupMembersHasExternal;

    if (isE2EEEnabled && !isDisabledDueToExternalAddresses) {
        return (
            <div className="p-1 flex flex-nowrap items-center mb-2">
                <Icon name="lock" className="shrink-0 color-primary" />
                <p className="text-sm color-primary flex-1 pl-4 my-0">
                    {c('Info').t`End-to-end email encryption is enabled for this group.`}
                </p>
            </div>
        );
    }

    const message = isDisabledDueToExternalAddresses
        ? c('Info').t`End-to-end email encryption is disabled for this group due to external addresses.`
        : c('Info').t`End-to-end email encryption is disabled for this group. It can be enabled.`;

    return (
        <div className="p-1 flex flex-nowrap items-center mb-2">
            <Icon name="exclamation-circle" className="shrink-0 color-warning" />
            <p className="text-sm color-warning flex-1 pl-4 my-0">{message}</p>
        </div>
    );
};

export default E2EEDisabledWarning;
