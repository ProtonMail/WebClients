import { createSelector } from '@reduxjs/toolkit';

import { EasySwitchState } from '../store';
import { ImportAuthType, ImportType } from '../types/shared.types';
import { DraftStep } from './draft.interface';

export const selectDraftUi = (state: EasySwitchState) => state.draft.ui;

export const selectDraftStep = createSelector(selectDraftUi, (ui) => ui.step);

export const selectDraftProvider = createSelector(selectDraftUi, (ui) =>
    ui.step === DraftStep.START ? ui.provider : undefined
);

export const selectDraftImportType = createSelector(selectDraftUi, (ui) => {
    return ui.step === DraftStep.START ? ui.importType : undefined;
});

export const selectDraftAuthType = createSelector(selectDraftUi, (ui) =>
    ui.step === DraftStep.START ? ui.authType : undefined
);

type DraftModal = null | 'select-product' | `import-${ImportType}` | 'read-instructions' | 'oauth';
export const selectDraftModal = createSelector(selectDraftUi, (ui): DraftModal => {
    if (ui.step === DraftStep.IDLE) {
        return null;
    }

    if (ui.step === DraftStep.START) {
        if (ui.authType === ImportAuthType.IMAP) {
            if (!ui.importType) {
                return 'select-product';
            }

            if (!ui.hasReadInstructions) {
                return 'read-instructions';
            }

            // When IMAP is selected importType is always a single value
            // We display a different modal for each IMAP import type
            // For OAUTH it's different because we have a single modal for all OAUTH providers
            if (typeof ui.importType === 'string') {
                return `import-${ui.importType}`;
            }
        }

        if (ui.authType === ImportAuthType.OAUTH) {
            return 'oauth';
        }
    }

    return null;
});
