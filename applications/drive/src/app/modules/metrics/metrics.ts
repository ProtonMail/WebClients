import type { User } from '@proton/shared/lib/interfaces';
import { isPaid } from '@proton/shared/lib/user/helpers';

import { GlobalErrorsMetrics } from './globalErrorsMetrics';
import { MetricUserPlan } from './types';

export class Metrics {
    private user?: User;
    private isPublicContext = false;

    globalErrors: GlobalErrorsMetrics;

    constructor() {
        this.globalErrors = new GlobalErrorsMetrics(this);
    }

    /**
     * Initialize the metrics module to report properly the user plan.
     * It should be called right after the user data is loaded.
     * The default value, if not called, is `unknown`.
     */
    init({ user, isPublicContext = false }: { user?: User; isPublicContext?: boolean }) {
        this.user = user;
        this.isPublicContext = isPublicContext;
        this.globalErrors.init();
    }

    destroy() {
        this.globalErrors.destroy();
    }

    updateUser(user?: User) {
        this.user = user;
    }

    getUserPlan(): MetricUserPlan {
        if (!this.user && this.isPublicContext) {
            return MetricUserPlan.Anonymous;
        }
        if (this.user) {
            return isPaid(this.user) ? MetricUserPlan.Paid : MetricUserPlan.Free;
        }
        return MetricUserPlan.Unknown;
    }
}
