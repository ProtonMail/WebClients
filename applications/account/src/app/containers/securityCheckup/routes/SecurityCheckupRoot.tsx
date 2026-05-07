import type { MutableRefObject, ReactNode } from 'react';
import { useEffect } from 'react';

import { sendSafetyReviewPageLoadTelemetryReport } from '@proton/account/safetyReview/telemetry/safetyReviewTelemetry';
import { useApi, useSecurityCheckup } from '@proton/components';

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
        if (!session?.initialCohort || pageLoadOnceRef.current) {
            return;
        }

        pageLoadOnceRef.current = true;

        sendSafetyReviewPageLoadTelemetryReport({
            api,
            initialCohort: session.initialCohort,
            source,
            variant: 'A',
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
