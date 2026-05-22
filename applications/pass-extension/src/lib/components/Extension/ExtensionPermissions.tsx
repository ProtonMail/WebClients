import type { FC, PropsWithChildren } from 'react';

import { hasPermissions, requestPermissions } from 'proton-pass-extension/lib/utils/permissions';

import { PermissionsProvider } from '@proton/pass/components/Core/PermissionsProvider';

export const ExtensionPermissions: FC<PropsWithChildren> = ({ children }) => (
    <PermissionsProvider requestPermission={requestPermissions} hasPermission={hasPermissions}>
        {children}
    </PermissionsProvider>
);
