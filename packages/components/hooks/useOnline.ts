import { useEffect, useState } from 'react';

const getOnlineStatus = () => {
    return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' ? navigator.onLine : true;
};

const useOnline = () => {
    const [onlineStatus, setOnlineStatus] = useState(getOnlineStatus());

    useEffect(() => {
        const handleOnlineStatus = () => {
            setOnlineStatus(getOnlineStatus());
        };
        handleOnlineStatus();
        window.addEventListener('online', handleOnlineStatus);
        window.addEventListener('offline', handleOnlineStatus);
        return () => {
            window.removeEventListener('online', handleOnlineStatus);
            window.removeEventListener('offline', handleOnlineStatus);
        };
    }, []);

    return onlineStatus;
};

export default useOnline;
