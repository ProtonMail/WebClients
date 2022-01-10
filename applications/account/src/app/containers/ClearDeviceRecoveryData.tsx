import { useEffect } from 'react';

import { removeDeviceRecovery } from '@proton/shared/lib/recoveryFile/deviceRecovery';

const ClearDeviceRecoveryData = () => {
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const clearDeviceRecoveryData = searchParams.get('clearDeviceRecoveryData');
        const usersToClearDataFor: string[] = clearDeviceRecoveryData ? JSON.parse(clearDeviceRecoveryData) : [];

        if (Array.isArray(usersToClearDataFor) && usersToClearDataFor.length > 0) {
            usersToClearDataFor.forEach((userId) => {
                removeDeviceRecovery(userId);
            });
        }

        if (clearDeviceRecoveryData) {
            searchParams.delete('clearDeviceRecoveryData');
            window.location.search = searchParams.toString();
        }
    }, []);

    return null;
};

export default ClearDeviceRecoveryData;
