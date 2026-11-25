import type { OAuthModalViewsOverride } from '../OAuthModalViews';
import { DriveImportFlow } from './DriveImportFlow';
import { isDriveOnlyDraft } from './isDriveOnlyDraft';

/**
 * DriveImportFlow covers Instructions, LoadingImporter, Prepare and Success. Being the same component
 * in every slot, it stays mounted from 'instructions' through 'success', so the dialog never closes
 * and reopens between steps. DriveImportProcessModal starts the importer task itself, so the
 * 'importing' step is never reached for Drive.
 */
export const driveOAuthViewsOverride: OAuthModalViewsOverride = {
    matches: isDriveOnlyDraft,
    views: {
        Instructions: DriveImportFlow,
        LoadingImporter: DriveImportFlow,
        Prepare: DriveImportFlow,
        Success: DriveImportFlow,
    },
};
