import { useFlag } from '@proton/unleash/useFlag';

/**
 * Contains logic relating to allowing public sharing of docs.
 */
export const useDriveDocsPublicSharingFF = () => {
    const disabled = useFlag('DriveDocsPublicSharingDisabled');

    const isDocsPublicSharingEnabled = !disabled;

    return {
        /**
         * Feature flag for allowing public sharing of docs.
         */
        isDocsPublicSharingEnabled,
    };
};
