import { useCallback, useEffect, useState } from 'react';

import type { ApiEvent } from '@proton/activation/src/api/api.interface';
import { ApiImporterState } from '@proton/activation/src/api/api.interface';
import { ImportType } from '@proton/activation/src/interface';
import { loadImporters } from '@proton/activation/src/logic/importers/importers.actions';
import { selectDriveImportStatus } from '@proton/activation/src/logic/importers/importers.selectors';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { useEventManager } from '@proton/components';

export type DriveImportOutcome = 'success' | 'failed';

/**
 * Drive import state for the Easy Switch sidebar entry: whether an import already happened,
 * whether one is running, and the outcome of the one that just finished.
 * The outcome comes from core events only, so a past import never opens a modal on page load.
 */
export const useDriveImportStatus = () => {
    const dispatch = useEasySwitchDispatch();
    const { subscribe } = useEventManager();
    const { isLoaded, isImporting, hasCompletedImport } = useEasySwitchSelector(selectDriveImportStatus);
    const [outcome, setOutcome] = useState<DriveImportOutcome>();

    useEffect(
        function loadEasySwitchImporters() {
            const request = dispatch(loadImporters());
            return () => request.abort();
        },
        [dispatch]
    );

    useEffect(
        function checkImportsStatus() {
            subscribe((event) => {
                const { Imports, ImportReports }: ApiEvent = event;

                const importerStates = (Imports ?? []).map(
                    ({ Importer }) => Importer?.Active?.[ImportType.DRIVE]?.State
                );
                const reportStates = (ImportReports ?? []).map(
                    ({ ImportReport }) => ImportReport?.Summary?.[ImportType.DRIVE]?.State
                );

                const driveStates = [...importerStates, ...reportStates];
                const isDone = driveStates.includes(ApiImporterState.DONE);
                const isFailed = driveStates.includes(ApiImporterState.FAILED);
                if (!isDone && !isFailed) {
                    return;
                }

                setOutcome(isDone ? 'success' : 'failed');

                // Importer events already update the importers slice, report events don't,
                // so only those need a refresh to update the sidebar entry.
                const isOutcomeFromReport = reportStates.some(
                    (state) => state === ApiImporterState.DONE || state === ApiImporterState.FAILED
                );
                if (isOutcomeFromReport) {
                    void dispatch(loadImporters());
                }
            });
        },
        [subscribe, dispatch]
    );

    return {
        isLoaded,
        isImporting,
        hasCompletedImport,
        outcome,
        clearOutcome: useCallback(() => setOutcome(undefined), []),
    };
};
