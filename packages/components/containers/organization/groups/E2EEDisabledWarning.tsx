import { c } from 'ttag';

import { Banner } from '@proton/atoms/Banner/Banner';
import Loader from '@proton/components/components/loader/Loader';
import { IcExclamationTriangleFilled } from '@proton/icons/icons/IcExclamationTriangleFilled';
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
        <Banner
            icon={<IcExclamationTriangleFilled size={4.5} className="color-weak" />}
            contentWrapperClassName="flex items-center"
        >
            <span className="color-weak">{message}</span>
        </Banner>
    );
};

export default E2EEDisabledWarning;
