import { type ReactNode, Suspense, lazy } from 'react';

import { isDesktopEnvironment } from '@proton/lumo-api-client/core/desktop-tools';
import { useFlag } from '@proton/unleash/useFlag';

import type { ScheduleExecutor, ScheduleSource } from '../services/schedules/types';

const EnabledScheduleServiceProvider = lazy(() => import('./EnabledScheduleServiceProvider'));

export type ScheduleServiceProviderProps = {
    children: ReactNode;
    source?: ScheduleSource;
    executor?: ScheduleExecutor;
};

/** Loads scheduled execution only on desktop with the schedules feature flag enabled. */
export function ScheduleServiceProvider(props: ScheduleServiceProviderProps) {
    const enabled = useFlag('LumoSchedules');
    if (!enabled || !isDesktopEnvironment()) return <>{props.children}</>;

    return (
        <Suspense fallback={props.children}>
            <EnabledScheduleServiceProvider {...props} />
        </Suspense>
    );
}
