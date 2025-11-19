import { useMeetingAuthentication } from './useMeetingAuthentication';
import { getPublicToken, getUrlPassword } from './usePublicToken';

export const useMeetingSetup = () => {
    const token = getPublicToken();
    const urlPassword = getUrlPassword();

    const { getMeetingDetails, getAccessDetails, initHandshake } = useMeetingAuthentication();

    return {
        token,
        urlPassword,
        getMeetingDetails,
        getAccessDetails,
        initHandshake,
    };
};
