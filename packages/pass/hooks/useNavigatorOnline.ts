import { useEffect, useState } from 'react';

export const useNavigatorOnline = () => {
    const [online, setOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handler = () => setOnline(navigator.onLine);
        window.addEventListener('online', handler);
        window.addEventListener('offline', handler);

        return () => {
            window.removeEventListener('online', handler);
            window.removeEventListener('offline', handler);
        };
    }, []);

    return online;
};
