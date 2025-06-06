import { useEffect } from 'react';

import { useMeetingName } from './useMeetingName';
import usePublicToken from './usePublicToken';

export const useSrpTest = () => {
    const { token, urlPassword } = usePublicToken();

    const getMeetingName = useMeetingName(token, urlPassword);

    useEffect(() => {
        void getMeetingName();
    }, []);

    return {
        token,
        urlPassword,
    };
};
