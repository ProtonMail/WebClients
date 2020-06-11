import { useEffect, useState } from 'react';

function getOnlineStatus() {
    return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' ? navigator.onLine : true;
}

const useOnline = () => {
    const [onlineStatus, setOnlineStatus] = useState(getOnlineStatus());
    const goOnline = () => setOnlineStatus(true);
    const goOffline = () => setOnlineStatus(false);

    useEffect(() => {
        window.addEventListener('online', goOnline);
        window.addEventListener('offline', goOffline);

        return () => {
            window.removeEventListener('online', goOnline);
            window.removeEventListener('offline', goOffline);
        };
    }, []);

    return onlineStatus;
};

export default useOnline;
