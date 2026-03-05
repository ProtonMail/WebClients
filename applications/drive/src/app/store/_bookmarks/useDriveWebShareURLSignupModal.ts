import { useFlag } from '@proton/unleash/useFlag';

export const useDriveWebShareURLSignupModal = () => {
    return useFlag('DriveWebShareURLSignupModal');
};
