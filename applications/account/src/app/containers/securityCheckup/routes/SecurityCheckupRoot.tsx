import type { MutableRefObject, ReactNode } from 'react';
import { useEffect } from 'react';

import { useApi, useSecurityCheckup } from '@proton/components';
import { TelemetryAccountSecurityCheckupEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';

import RecommendedActions from '../RecommendedActions';
import SecurityCheckupSummaryTitle from '../SecurityCheckupSummaryTitle';

const SecurityCheckupRoot = ({
    pageLoadOnceRef,
    children,
}: {
    pageLoadOnceRef: MutableRefObject<boolean>;
    children?: ReactNode;
}) => {
    const api = useApi();

    const { session, source } = useSecurityCheckup();

    useEffect(() => {
        if (!session?.initialCohort || !source || pageLoadOnceRef.current) {
            return;
        }

        pageLoadOnceRef.current = true;
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.accountSecurityCheckup,
            event: TelemetryAccountSecurityCheckupEvents.pageLoad,
            dimensions: {
                initialCohort: session.initialCohort,
                source,
            },
        });
    }, [session?.initialCohort, source]);

    return (
        <>
            <SecurityCheckupSummaryTitle className="mb-14" />

            <div className="m-auto max-w-custom" style={{ '--max-w-custom': '34rem' }}>
                <RecommendedActions />
            </div>
            {children}
        </>
    );
};

export default SecurityCheckupRoot;
