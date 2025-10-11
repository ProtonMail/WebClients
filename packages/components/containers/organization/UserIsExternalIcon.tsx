import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Icon from '@proton/components/components/icon/Icon';
import { GROUP_MEMBER_TYPE } from '@proton/shared/lib/interfaces';

// based on the Info component - packages/components/components/link/Info.tsx
const UserIsExternalIcon = ({ groupMemberType }: { groupMemberType: GROUP_MEMBER_TYPE }) => {
    if (groupMemberType === GROUP_MEMBER_TYPE.INTERNAL) {
        return null;
    }

    const messages = {
        [GROUP_MEMBER_TYPE.INTERNAL_TYPE_EXTERNAL]: c('tooltip').t`Disables end-to-end email encryption for this group`,
        [GROUP_MEMBER_TYPE.EXTERNAL]: c('tooltip')
            .t`External address - disables end-to-end email encryption for this group, and no encrypted resources will be shared with this user.`,
    };

    const tooltipMessage = messages[groupMemberType];

    return (
        <Tooltip title={tooltipMessage} openDelay={0} closeDelay={250} longTapDelay={0} originalPlacement="top">
            <Icon name="exclamation-circle" className="shrink-0 color-warning" />
        </Tooltip>
    );
};

export default UserIsExternalIcon;
