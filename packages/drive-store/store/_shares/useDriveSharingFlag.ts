import { useFlag } from '@proton/components/containers';

export const useDriveSharingFlags = () => {
    const driveSharingDisabled = useFlag('DriveSharingDisabled');
    const driveSharingEditingDisabled = useFlag('DriveSharingEditingDisabled');
    const driveSharingInvitations = useFlag('DriveSharingInvitations');

    return {
        isDirectSharingDisabled: driveSharingDisabled, // Kill switch that disable direct sharing
        isSharingInviteAvailable: driveSharingInvitations,
        isReadOnlyMode: driveSharingEditingDisabled || driveSharingDisabled,
    };
};
