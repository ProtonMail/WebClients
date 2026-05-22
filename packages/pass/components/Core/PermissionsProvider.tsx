import type { FC, PropsWithChildren } from 'react';
import { createContext, useContext, useMemo } from 'react';

import { c } from 'ttag';
import type { Permissions } from 'webextension-polyfill';

import { ConfirmationPrompt } from '@proton/pass/components/Confirmation/ConfirmationPrompt';
import { useAsyncModalHandles } from '@proton/pass/hooks/useAsyncModalHandles';
import type { MaybeNull, Unpack } from '@proton/pass/types/utils/index';

export type Permission = Unpack<Permissions.Permissions['permissions']>;
export type PermissionPrompt = { title: string; message: string };

type PermissionService = {
    hasPermission: (permissions: Permission[]) => Promise<boolean>;
    requestPermission: (permissions: Permission[]) => Promise<boolean>;
};

type PermissionsContextValue = {
    /** Resolves `true` if the permissions are already granted. */
    hasPermission: (permissions: Permission[]) => Promise<boolean>;
    /** Shows a confirmation prompt before invoking the browser permission
     * request. Granting permissions like `nativeMessaging` triggers a worker
     * reload, so the user must be warned first. Resolves `true` when granted. */
    requestPermission: (permissions: Permission[], opts: PermissionPrompt) => Promise<void>;
};

const PermissionsContext = createContext<MaybeNull<PermissionsContextValue>>(null);
const getInitialModalState = (): PermissionPrompt => ({ title: '', message: '' });

export const PermissionsProvider: FC<PropsWithChildren<PermissionService>> = ({
    children,
    hasPermission,
    requestPermission,
}) => {
    const modal = useAsyncModalHandles<boolean, PermissionPrompt>({ getInitialModalState });

    const ctx = useMemo<PermissionsContextValue>(() => {
        return {
            hasPermission,
            requestPermission: async (permissions, options) => {
                await modal.handler({
                    ...options,
                    onSubmit: () => requestPermission(permissions),
                });
            },
        };
    }, []);

    return (
        <PermissionsContext.Provider value={ctx}>
            {children}
            {modal.state.open && (
                <ConfirmationPrompt
                    title={modal.state.title}
                    message={modal.state.message}
                    confirmText={c('Action').t`Continue`}
                    onCancel={() => modal.abort()}
                    onConfirm={() => modal.resolver(true)}
                />
            )}
        </PermissionsContext.Provider>
    );
};

export const usePermissionsProvider = () => useContext(PermissionsContext);
