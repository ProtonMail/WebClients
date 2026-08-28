import type { FC, PropsWithChildren } from 'react';

import { PermissionsProvider } from '@proton/pass/components/Core/PermissionsProvider';

import { hasPermissions, requestPermissions } from '../../utils/permissions';

export const ExtensionPermissions: FC<PropsWithChildren> = ({ children }) => (
    <PermissionsProvider requestPermission={requestPermissions} hasPermission={hasPermissions}>
        {children}
    </PermissionsProvider>
);
