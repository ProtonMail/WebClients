import { useFlag } from '@proton/unleash/useFlag';

export const useDriveSharingFlags = () => {
    const driveSharingDisabled = useFlag('DriveSharingDisabled');
    const driveSharingEditingDisabled = useFlag('DriveSharingEditingDisabled');

    return {
        isReadOnlyMode: driveSharingEditingDisabled || driveSharingDisabled,
    };
};
