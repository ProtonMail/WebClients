import { useFlag } from '@proton/unleash';

/**
 * Contains logic relating to the availability of Proton Docs.
 */
export const useDriveDocsFeatureFlag = () => {
    const disabled = useFlag('DriveDocsDisabled');

    const isDocsEnabled = !disabled;

    return {
        isDocsEnabled,
    };
};
