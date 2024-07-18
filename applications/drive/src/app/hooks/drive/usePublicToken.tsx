import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import { getUrlPassword } from '../../utils/url/password';

export default function usePublicToken() {
    const { pathname } = useLocation();
    const token = useMemo(() => pathname.replace(/\/urls\/?/, ''), [pathname]);
    const urlPassword = getUrlPassword();

    return {
        token,
        urlPassword,
    };
}
