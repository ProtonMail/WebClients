import { useFlag } from '@proton/unleash';

/**
 * Contains logic relating to allowing public sharing of docs.
 */
export const useFlagsDriveDocsPublicSharing = () => {
    const disabled = useFlag('DriveDocsPublicSharingDisabled');

    return {
        /**
         * Feature flag for allowing public sharing of docs.
         */
        isDocsPublicSharingEnabled: !disabled,
    };
};
