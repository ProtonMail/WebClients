import { useFlag } from '@proton/unleash/useFlag';

export const useDriveSharingFlags = () => {
    const driveSharingDisabled = useFlag('DriveSharingDisabled');
    const driveSharingEditingDisabled = useFlag('DriveSharingEditingDisabled');
    const driveSharingExternalInvitationsDisabled = useFlag('DriveSharingExternalInvitationsDisabled'); // Kill switch that disable external invitations

    return {
        isDirectSharingDisabled: driveSharingDisabled, // Kill switch that disable direct sharing
        isSharingExternalInviteDisabled: driveSharingExternalInvitationsDisabled,
        isReadOnlyMode: driveSharingEditingDisabled || driveSharingDisabled,
    };
};
