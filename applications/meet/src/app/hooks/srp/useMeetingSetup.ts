import { useMeetingAuthentication } from './useMeetingAuthentication';
import usePublicToken from './usePublicToken';

export const useMeetingSetup = () => {
    const { token, urlPassword } = usePublicToken();

    const { getRoomName, getAccessDetails, getHandshakeInfo } = useMeetingAuthentication();

    return {
        token,
        urlPassword,
        getRoomName,
        getAccessDetails,
        getHandshakeInfo,
    };
};
