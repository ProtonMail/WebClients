import { useMemo } from 'react';

const getUrlPassword = () => {
    const hash = window.location.hash;
    const pass = hash.replace('#', '');
    return pass;
};

export default function usePublicToken() {
    const pathname = window.location.pathname;

    const token = useMemo(() => {
        return pathname.split('/').at(-1) as string;
    }, [pathname]);
    const urlPassword = useMemo(() => getUrlPassword(), []);

    return {
        token,
        urlPassword,
    };
}
