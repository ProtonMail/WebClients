import { useMemo } from 'react';

const getUrlPassword = () => {
    const hash = window.location.hash;

    const password = hash.replace('#pwd-', '');

    return password;
};

export default function usePublicToken() {
    const pathname = window.location.pathname;

    const potentialId = pathname.split('/').at(-1);

    const token = useMemo(() => {
        return potentialId?.includes('id-') ? (potentialId?.replace('id-', '') as string) : '';
    }, [pathname]);
    const urlPassword = useMemo(() => getUrlPassword(), []);

    return {
        token,
        urlPassword,
    };
}
