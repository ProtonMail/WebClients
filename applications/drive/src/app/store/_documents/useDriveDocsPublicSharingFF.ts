import { useFlag } from '@proton/unleash';

/**
 * Contains logic relating to allowing public sharing of docs.
 */
export const useDriveDocsPublicSharingFF = () => {
    const disabled = useFlag('DriveDocsPublicSharingDisabled');
    const active = useFlag('DriveDocsPublicSharing');

    const isDocsPublicSharingEnabled = !disabled && active;

    return {
        /**
         * Feature flag for allowing public sharing of docs.
         */
        isDocsPublicSharingEnabled,
    };
};
