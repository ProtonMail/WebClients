import { useEffect, useMemo, useState } from 'react';

import noop from '@proton/utils/noop';

import { type Permission, hasPermissions, requestPermissions } from '../utils/permissions';

export interface PermissionHandles {
    enabled: boolean;
    request: () => Promise<boolean>;
}

export const usePermissions = (permissions: Permission[]): PermissionHandles => {
    const [enabled, setEnabled] = useState(permissions.length === 0);

    useEffect(() => {
        if (permissions.length > 0) void hasPermissions(permissions).then(setEnabled).catch(noop);
    }, [permissions]);

    return useMemo(
        () => ({
            enabled,
            request: async () =>
                permissions.length > 0
                    ? requestPermissions(permissions)
                          .then((result) => {
                              setEnabled(result);
                              return result;
                          })
                          .catch(() => false)
                    : true,
        }),
        [enabled, permissions]
    );
};
