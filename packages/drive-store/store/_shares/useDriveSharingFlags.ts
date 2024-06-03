import { useFlag } from '@proton/components/containers';

export const useDriveSharingFlags = () => {
    const driveSharingDisabled = useFlag('DriveSharingDisabled');
    const driveSharingEditingDisabled = useFlag('DriveSharingEditingDisabled');
    const driveSharingInvitations = useFlag('DriveSharingInvitations');
    const driveSharingExternalInvitationsDisabled = useFlag('DriveSharingExternalInvitationsDisabled'); // Kill switch that disable external invitations
    const driveSharingExternalInvitations = useFlag('DriveSharingExternalInvitations');

    return {
        isDirectSharingDisabled: driveSharingDisabled, // Kill switch that disable direct sharing
        isSharingInviteAvailable: driveSharingInvitations,
        isSharingExternalInviteDisabled: driveSharingExternalInvitationsDisabled,
        isSharingExternalInviteAvailable: driveSharingExternalInvitations,
        isReadOnlyMode: driveSharingEditingDisabled || driveSharingDisabled,
    };
};
