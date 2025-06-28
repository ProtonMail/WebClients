import { useEffect, useState } from 'react';

import { useGetUser } from '@proton/account/user/hooks';
import { useAuthentication } from '@proton/components';
import type { User } from '@proton/shared/lib/interfaces';

import { sendErrorReport } from '../../utils/errorHandling';
import { getIsPublicContext } from '../../utils/getIsPublicContext';
import { MetricUserPlan } from '../../utils/type/MetricTypes';
import { getMetricsUserPlan } from './getMetricsUserPlan';

export function useGetMetricsUserPlan() {
    const getUser = useGetUser();
    const { UID } = useAuthentication();
    const [plan, setPlan] = useState(MetricUserPlan.Unknown);
    const isPublicContext = getIsPublicContext();

    useEffect(() => {
        // UID will be define during loading if user is logged-in
        // but we should be fine as no request will be made during that time
        if (!UID) {
            setPlan(getMetricsUserPlan({ isPublicContext }));
            return;
        }
        void getUser()
            .then((user: User) => {
                setPlan(getMetricsUserPlan({ user, isPublicContext }));
            })
            // Silently failing as it used for metrics.
            .catch((err) => {
                sendErrorReport(err);
                console.error(err);
            });
    }, [getUser, UID, isPublicContext]);

    return plan;
}
