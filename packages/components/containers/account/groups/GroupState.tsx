import { c } from 'ttag';

import Badge from '@proton/components/components/badge/Badge';
import type { GroupMembership } from '@proton/shared/lib/interfaces';

const GroupStateBadge = ({ type, text }: { type: 'success' | 'light' | undefined; text: string }) => {
    return (
        <Badge type={type ?? 'default'} data-testid="group-state">
            {text}
        </Badge>
    );
};

const GroupState = ({ membership }: { membership: GroupMembership }) => {
    if (membership.Status === 'active') {
        return <GroupStateBadge type="success" text={c('Group state').t`Active`} />;
    } else if (membership.Status === 'unanswered') {
        return <GroupStateBadge type="light" text={c('Group state').t`Unanswered`} />;
    }

    return <GroupStateBadge type={undefined} text="-" />;
};

export default GroupState;
