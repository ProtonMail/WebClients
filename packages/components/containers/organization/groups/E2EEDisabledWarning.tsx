import { c } from 'ttag';

import Loader from '@proton/components/components/loader/Loader';
import { IcExclamationCircle } from '@proton/icons/icons/IcExclamationCircle';
import type { GroupMember } from '@proton/shared/lib/interfaces';
import { GROUP_MEMBER_TYPE } from '@proton/shared/lib/interfaces';

const E2EEDisabledWarning = ({
    groupMembers,
    loadingGroupMembers,
}: {
    groupMembers: GroupMember[];
    loadingGroupMembers: boolean;
}) => {
    if (loadingGroupMembers) {
        return <Loader />;
    }

    const groupMembersHasExternal = groupMembers.some(({ Type }) => Type !== GROUP_MEMBER_TYPE.INTERNAL);

    const message = groupMembersHasExternal
        ? c('Info').t`End-to-end email encryption is disabled for this group due to external addresses.`
        : c('Info').t`End-to-end email encryption is disabled for this group. It can be enabled.`;

    return (
        <div className="p-1 flex flex-nowrap items-center">
            <IcExclamationCircle className="shrink-0 color-warning" />
            <p className="text-sm color-warning flex-1 pl-4 my-0">{message}</p>
        </div>
    );
};

export default E2EEDisabledWarning;
