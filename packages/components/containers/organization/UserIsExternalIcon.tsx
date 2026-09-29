import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcExclamationCircle } from '@proton/icons/icons/IcExclamationCircle';
import { GROUP_MEMBER_TYPE } from '@proton/shared/lib/interfaces';

interface Props {
    groupMemberType: GROUP_MEMBER_TYPE;
    showMailWarning: boolean;
    showCannotPromoteWarning: boolean;
}

// based on the Info component - packages/components/components/link/Info.tsx
const UserIsExternalIcon = ({ groupMemberType, showMailWarning, showCannotPromoteWarning }: Props) => {
    const mailMessages: Partial<Record<GROUP_MEMBER_TYPE, string>> = {
        [GROUP_MEMBER_TYPE.INTERNAL_TYPE_EXTERNAL]: c('tooltip').t`Disables end-to-end email encryption for this group`,
        [GROUP_MEMBER_TYPE.EXTERNAL]: c('tooltip')
            .t`External address - disables end-to-end email encryption for this group, and no encrypted resources will be shared with this user.`,
    };

    const getTooltipMessage = () => {
        const mailMessage = showMailWarning ? mailMessages[groupMemberType] : undefined;
        const cannotPromoteMessage = showCannotPromoteWarning
            ? c('tooltip').t`External address - cannot be granted the roles and permissions assigned to this group.`
            : undefined;

        if (mailMessage && cannotPromoteMessage) {
            return c('tooltip')
                .t`External address — No end-to-end encryption or resource sharing, and roles and permissions can't be assigned.`;
        }

        return mailMessage ?? cannotPromoteMessage;
    };

    const tooltipMessage = getTooltipMessage();

    if (!tooltipMessage) {
        return null;
    }

    return (
        <Tooltip title={tooltipMessage} openDelay={0} closeDelay={250} longTapDelay={0} originalPlacement="top">
            <span className="inline-flex shrink-0 ml-1">
                <IcExclamationCircle className="color-warning" alt={tooltipMessage} />
            </span>
        </Tooltip>
    );
};

export default UserIsExternalIcon;
