import { useFlag } from '@proton/unleash';

export const useDriveWebShareURLSignupModal = () => {
    return useFlag('DriveWebShareURLSignupModal');
};
