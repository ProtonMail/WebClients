import { useEffect, useRef, useState } from 'react';

import { resetOauthDraft } from '../../../../logic/draft/oauthDraft/oauthDraft.actions';
import { selectOauthImportStateStep } from '../../../../logic/draft/oauthDraft/oauthDraft.selector';
import { getDriveReportOutcome } from '../../../../logic/reports/reports.helpers';
import type { ReportSummariesMap } from '../../../../logic/reports/reports.interface';
import { selectReportsLoading, selectReportsSummariesMap } from '../../../../logic/reports/reports.selectors';
import { useEasySwitchDispatch, useEasySwitchSelector } from '../../../../logic/store';
import { DriveImportGenericErrorStep } from './DriveImportGenericErrorStep';
import { DriveImportSuccessStep } from './DriveImportSuccessStep';

// v6 events carry no import state --> reports refetch --> compare with previous load. First load is the baseline, so past imports never open a modal.
export const DriveImportOutcomeModal = () => {
    const dispatch = useEasySwitchDispatch();
    const summaries = useEasySwitchSelector(selectReportsSummariesMap);
    const reportsLoading = useEasySwitchSelector(selectReportsLoading);
    const oauthStep = useEasySwitchSelector(selectOauthImportStateStep);
    const previousSummaries = useRef<ReportSummariesMap>();
    const [outcome, setOutcome] = useState<'success' | 'failed'>();

    useEffect(
        function detectDriveImportOutcome() {
            if (reportsLoading !== 'success') {
                return;
            }
            if (previousSummaries.current) {
                const nextOutcome = getDriveReportOutcome(previousSummaries.current, summaries);
                if (nextOutcome) {
                    setOutcome(nextOutcome);
                }
            }
            previousSummaries.current = summaries;
        },
        [reportsLoading, summaries]
    );

    // Outcome arrives while the "Import started" modal is open --> close it so only the outcome modal shows.
    useEffect(
        function resetOauthDraftOnOutcome() {
            if (outcome && oauthStep === 'success') {
                dispatch(resetOauthDraft());
            }
        },
        [dispatch, oauthStep, outcome]
    );

    const handleClose = () => setOutcome(undefined);

    if (outcome === 'success') {
        return <DriveImportSuccessStep onClose={handleClose} />;
    }
    if (outcome === 'failed') {
        return <DriveImportGenericErrorStep onClose={handleClose} />;
    }
    return null;
};
