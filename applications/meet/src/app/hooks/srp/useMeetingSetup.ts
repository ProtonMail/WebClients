import { useMeetingAuthentication } from './useMeetingAuthentication';
import { getPublicToken, getUrlPassword } from './usePublicToken';

export const useMeetingSetup = () => {
    const token = getPublicToken();
    const urlPassword = getUrlPassword();

    const { getRoomName, getAccessDetails, initHandshake } = useMeetingAuthentication();

    return {
        token,
        urlPassword,
        getRoomName,
        getAccessDetails,
        initHandshake,
    };
};
