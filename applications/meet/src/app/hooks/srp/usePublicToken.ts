import { useMemo } from 'react';

const getUrlPassword = () => {
    const hash = window.location.hash;

    const params = new URLSearchParams(hash.slice(1));
    const password = params.get('pwd') ?? '';
    return password;
};

export default function usePublicToken() {
    const pathname = window.location.pathname;

    const token = useMemo(() => {
        return pathname.split('/').at(-1)?.replace('id-', '') as string;
    }, [pathname]);
    const urlPassword = useMemo(() => getUrlPassword(), []);

    return {
        token,
        urlPassword,
    };
}
