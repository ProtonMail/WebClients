import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

export default function usePublicToken() {
    const { pathname, hash } = useLocation();
    const token = useMemo(() => pathname.replace(/\/urls\/?/, ''), [pathname]);
    const urlPassword = useMemo(() => hash.replace('#', ''), [hash]);

    return {
        token,
        urlPassword,
    };
}
