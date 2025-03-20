import type { User } from '@proton/shared/lib/interfaces';
import { formatUser } from '@proton/shared/lib/user/helpers';

import { MetricUserPlan } from '../../utils/type/MetricTypes';

export const getMetricsUserPlan = ({ user, isPublicContext = false }: { user?: User; isPublicContext?: boolean }) => {
    if (!user && isPublicContext) {
        return MetricUserPlan.Anonymous;
    }
    if (user) {
        return formatUser(user).isPaid ? MetricUserPlan.Paid : MetricUserPlan.Free;
    }
    return MetricUserPlan.Unknown;
};
