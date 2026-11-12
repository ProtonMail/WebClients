import { createSelector } from '@reduxjs/toolkit';

import orderBy from '@proton/utils/orderBy';

import { ApiImporterError, ApiImporterState } from '../../api/api.interface';
import { ImportType } from '../../interface';
import type { EasySwitchState } from '../store';
import type { ActiveImporter, ActiveImportersMap, Importer, ImportersMap } from './importers.interface';

const selectImportersMap = (state: EasySwitchState): ImportersMap => state.importers.importers;
const selectActiveImportersMap = (state: EasySwitchState): ActiveImportersMap => state.importers.activeImporters;
const selectImportersLoading = (state: EasySwitchState) => state.importers.loading;

const selectActiveImporters = createSelector(selectActiveImportersMap, (activeImportersMap): ActiveImporter[] =>
    Object.values(activeImportersMap)
);

export const selectActiveImporterEntriesByDate = createSelector(
    [selectActiveImporters, selectImportersMap],
    (activeImporters, importersMap): { activeImporter: ActiveImporter; importer: Importer }[] =>
        orderBy(activeImporters, 'startDate')
            .flatMap((activeImporter) => {
                const importer = importersMap[activeImporter.importerID];
                return importer ? [{ activeImporter, importer }] : [];
            })
            .reverse()
);

export const selectActiveImportersErrors = createSelector(
    [selectImportersMap, selectActiveImporters],
    (importersMap, activeImporters) => {
        const delayedImportAccounts: string[] = [];
        const importErrors = activeImporters.reduce<('storageLimit' | 'authConnection' | 'delayedImport')[]>(
            (acc, activeImporter) => {
                const { importState, errorCode, importerID, product } = activeImporter;
                const { account } = importersMap[importerID];
                // Drive pause reason is already shown on its import row and in the Drive app --> no banner
                const isPausedWithBanner = importState === ApiImporterState.PAUSED && product !== ImportType.DRIVE;

                if (
                    !acc.includes('storageLimit') &&
                    isPausedWithBanner &&
                    errorCode === ApiImporterError.ERROR_CODE_QUOTA_LIMIT
                ) {
                    acc.push('storageLimit');
                }

                if (
                    !acc.includes('authConnection') &&
                    isPausedWithBanner &&
                    errorCode === ApiImporterError.ERROR_CODE_IMAP_CONNECTION
                ) {
                    acc.push('authConnection');
                }

                if (!acc.includes('authConnection') && importState === ApiImporterState.DELAYED) {
                    acc.push('delayedImport');
                }
                if (importState === ApiImporterState.DELAYED) {
                    delayedImportAccounts.push(account);
                }

                return acc;
            },
            []
        );

        return { importErrors, delayedImportAccounts };
    }
);

// TODO: Check if we need to implement something for ApiImporterState.CANCELED
const DRIVE_IMPORT_RUNNING_STATES = [ApiImporterState.QUEUED, ApiImporterState.RUNNING, ApiImporterState.DELAYED];

const selectHasDriveImporter = createSelector(selectImportersMap, (importersMap): boolean =>
    Object.values(importersMap).some((importer) => importer.products.includes(ImportType.DRIVE))
);

const selectIsDriveImportRunning = createSelector(selectActiveImporters, (activeImporters): boolean =>
    activeImporters.some(
        ({ product, importState }) => product === ImportType.DRIVE && DRIVE_IMPORT_RUNNING_STATES.includes(importState)
    )
);

const selectPausedDriveImport = createSelector(selectActiveImporterEntriesByDate, (entries) =>
    entries.find(
        ({ activeImporter }) =>
            activeImporter.product === ImportType.DRIVE && activeImporter.importState === ApiImporterState.PAUSED
    )
);

export interface DriveImportStatus {
    /** False until loadImporters resolved once, so callers can tell "not known yet" apart from "nothing imported". */
    isLoaded: boolean;
    isImporting: boolean;
    /** Stopped by the backend, `activeImporter.errorCode` gives the reason (storage limit or connection error). */
    pausedImport?: { activeImporter: ActiveImporter; importer: Importer };
    isPaused: boolean;
    hasCompletedImport: boolean;
}

export const selectDriveImportStatus = createSelector(
    [selectHasDriveImporter, selectIsDriveImportRunning, selectPausedDriveImport, selectImportersLoading],
    (hasDriveImporter, isImporting, pausedImport, loading): DriveImportStatus => ({
        isLoaded: loading === 'success' || loading === 'failed',
        isImporting,
        pausedImport,
        isPaused: !!pausedImport,
        hasCompletedImport: hasDriveImporter && !isImporting && !pausedImport,
    })
);
