import type { OAuthModalViewsOverride } from '../OAuthModalViews';
import DriveAutoSkipPrepareStep from './DriveAutoSkipPrepareStep';
import { isDriveOnlyDraft } from './isDriveOnlyDraft';

/** Proof-of-concept override, gated behind the EasySwitchB2CForDriveWebNewUI flag. */
export const driveOAuthViewsOverride: OAuthModalViewsOverride = {
    matches: isDriveOnlyDraft,
    views: {
        Prepare: DriveAutoSkipPrepareStep,
    },
};
