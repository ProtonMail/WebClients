import type { CSSProperties } from 'react';

import { c } from 'ttag';

import { Pill } from '@proton/atoms/Pill/Pill';
import { TransitionSlot } from '@proton/atoms/TransitionSlot/TransitionSlot';
import { GROUP_MEMBERSHIP_STATUS } from '@proton/shared/lib/interfaces/GroupMember';
import type { GroupMembership } from '@proton/shared/lib/interfaces/GroupMember';

// Theme tokens, so the pills follow every light and dark theme
const pillTextColor = 'var(--text-norm)';

const slotStyle: CSSProperties = { justifyItems: 'start' };

/** Every status pill stays mounted, so accepting an invitation crossfades the pill instead of replacing it. */
const GroupState = ({ membership }: { membership: GroupMembership }) => {
    // The test id follows the visible pill, as both stay mounted
    const testId = (status: GROUP_MEMBERSHIP_STATUS) => (status === membership.Status ? 'group-state' : undefined);

    const items: Record<GROUP_MEMBERSHIP_STATUS, JSX.Element> = {
        [GROUP_MEMBERSHIP_STATUS.ACTIVE]: (
            <Pill
                className="text-semibold"
                rounded="rounded-sm"
                color={pillTextColor}
                backgroundColor="var(--signal-info-minor-1)"
                data-testid={testId(GROUP_MEMBERSHIP_STATUS.ACTIVE)}
            >
                {c('Group state').t`Active`}
            </Pill>
        ),
        [GROUP_MEMBERSHIP_STATUS.UNANSWERED]: (
            <Pill
                className="text-semibold"
                rounded="rounded-sm"
                color={pillTextColor}
                backgroundColor="var(--signal-warning-minor-1)"
                data-testid={testId(GROUP_MEMBERSHIP_STATUS.UNANSWERED)}
            >
                {c('Group state').t`Unanswered`}
            </Pill>
        ),
    };

    return <TransitionSlot activeKey={membership.Status} items={items} style={slotStyle} />;
};

export default GroupState;
