import { useFlag } from '@proton/components/containers';

/**
 * A boolean representing if the Drive Docs feature is enabled.
 *
 * *Combines multiple flags.*
 */
export const useDriveDocsFeatureFlag = () => {
    const disabled = useFlag('DriveDocsDisabled');
    const active = useFlag('DriveDocs');

    return !disabled && active;
};
