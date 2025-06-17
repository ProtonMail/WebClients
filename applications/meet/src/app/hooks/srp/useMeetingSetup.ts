import { useMeetingAuthentication } from './useMeetingAuthentication';
import usePublicToken from './usePublicToken';

export const useMeetingSetup = () => {
    const { token, urlPassword } = usePublicToken();

    const { getRoomName, getAcccessDetails } = useMeetingAuthentication(token, urlPassword);

    return {
        token,
        urlPassword,
        getRoomName,
        getAcccessDetails,
    };
};
