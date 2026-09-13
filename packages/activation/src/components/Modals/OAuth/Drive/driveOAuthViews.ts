import type { OAuthModalViewsOverride } from '../OAuthModalViews';
import { DriveImportProcessModal } from './DriveImportProcessModal';
import { DriveInstructionsStep } from './DriveInstructionsStep';
import { isDriveOnlyDraft } from './isDriveOnlyDraft';

/**
 * DriveImportProcessModal covers LoadingImporter, Prepare and Success: it starts the importer task
 * itself and stays mounted from 'loading-importer' through 'success', so the illustration never
 * blinks closed/reopen and the 'importing' step is never reached for Drive.
 */
export const driveOAuthViewsOverride: OAuthModalViewsOverride = {
    matches: isDriveOnlyDraft,
    views: {
        Instructions: DriveInstructionsStep,
        LoadingImporter: DriveImportProcessModal,
        Prepare: DriveImportProcessModal,
        Success: DriveImportProcessModal,
    },
};
