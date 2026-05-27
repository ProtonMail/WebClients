import type { User } from '@proton/shared/lib/interfaces';
import { isPaid } from '@proton/shared/lib/user/helpers';

import { DrivePerformanceMetrics } from './drivePerformanceMetrics';
import { GlobalErrorsMetrics } from './globalErrorsMetrics';
import { MetricUserPlan } from './types';

export class Metrics {
    private user?: User;
    private isPublicContext = false;

    globalErrors: GlobalErrorsMetrics;
    drivePerformance: DrivePerformanceMetrics;

    constructor() {
        this.globalErrors = new GlobalErrorsMetrics(this);
        this.drivePerformance = new DrivePerformanceMetrics();
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

/**
 * Drive global metrics module.
 *
 * Initialize it right after the user data is loaded.
 *
 * @example
 * ```ts
 * driveMetrics.init({ user: userData.user });
 * ```
 *
 * Use it to report various Drive-wide metrics.
 *
 * @example
 * ```ts
 * driveMetrics.globalErrors.markCrashError();
 * ```
 */
export const driveMetrics = new Metrics();
