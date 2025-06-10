import { useEffect, useMemo, useState } from 'react';

import { type Permission, hasPermission, requestPermission } from 'proton-pass-extension/lib/utils/permissions';

export interface PermissionHandles {
    enabled: boolean;
    request: () => Promise<boolean>;
}

export const usePermission = (permission: Permission): PermissionHandles => {
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        void hasPermission(permission).then(setEnabled);
    }, [permission]);

    return useMemo(
        () => ({
            enabled,
            request: () =>
                requestPermission(permission).then((result) => {
                    setEnabled(result);
                    return result;
                }),
        }),
        [enabled, permission]
    );
};
