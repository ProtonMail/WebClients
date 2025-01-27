import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import { getUrlPassword } from '../../utils/url/password';

export default function usePublicToken() {
    const { pathname } = useLocation();
    const token = useMemo(() => {
        // Return first part before the hash
        if (pathname.includes('/urls/')) {
            return pathname.replace('/urls/', '').split('#')[0];
        }
        return '';
    }, [pathname]);
    const urlPassword = useMemo(() => getUrlPassword(), []);

    return {
        token,
        urlPassword,
    };
}
