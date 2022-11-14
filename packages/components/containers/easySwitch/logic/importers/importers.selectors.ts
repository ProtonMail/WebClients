import { createSelector } from '@reduxjs/toolkit';

import orderBy from '@proton/utils/orderBy';

import { EasySwitchState } from '../store';
import { ApiImporterError, ApiImporterState } from '../types/api.types';
import { ActiveImportID, ActiveImporter, ActiveImportersMap, Importer, ImportersMap } from './importers.interface';

const selectImportersMap = (state: EasySwitchState): ImportersMap => state.importers.importers;
const selectActiveImportersMap = (state: EasySwitchState): ActiveImportersMap => state.importers.activeImporters;
export const selectImportersState = (state: EasySwitchState) => state.importers.loading;

export const selectImporters = createSelector([selectImportersMap], (importersMap): Importer[] =>
    Object.values(importersMap)
);

export const selectActiveImporters = createSelector(selectActiveImportersMap, (activeImportersMap): ActiveImporter[] =>
    Object.values(activeImportersMap)
);

export const selectImporterById = createSelector(
    selectImportersMap,
    (_: EasySwitchState, ID: string) => ID,
    (importersMap, ID) => importersMap[ID]
);

export const selectActiveImporterById = createSelector(
    selectActiveImportersMap,
    (_: EasySwitchState, ID: ActiveImportID) => ID,
    (activeImportersMap, ID) => activeImportersMap[ID]
);

export const selectActiveImporterIdsByDate = createSelector(selectActiveImporters, (activeImporters) =>
    orderBy(activeImporters, 'startDate')
        .map(({ localID }) => localID)
        .reverse()
);

export const selectActiveImportersErrors = createSelector(
    [selectImportersMap, selectActiveImporters],
    (importersMap, activeImporters) => {
        const delayedImportAccounts: string[] = [];
        const importErrors = activeImporters.reduce<('storageLimit' | 'authConnection' | 'delayedImport')[]>(
            (acc, activeImporter) => {
                const { importState, errorCode, importerID } = activeImporter;
                const { account } = importersMap[importerID];

                if (
                    !acc.includes('storageLimit') &&
                    importState === ApiImporterState.PAUSED &&
                    errorCode === ApiImporterError.ERROR_CODE_QUOTA_LIMIT
                ) {
                    acc.push('storageLimit');
                }

                if (
                    !acc.includes('authConnection') &&
                    importState === ApiImporterState.PAUSED &&
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
