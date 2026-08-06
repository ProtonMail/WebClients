import type { ComponentType } from 'react';

import type { Props as AuthenticationProviderProps } from '@proton/components/containers/authentication/Provider';
import AuthenticationProvider from '@proton/components/containers/authentication/Provider';

export const withAuthentication =
    (store: AuthenticationProviderProps['store'] = { UID: 'uid-123' } as any) =>
    <T extends {}>(Component: ComponentType<T>) =>
        function AuthenticationProviderHOC(props: T & JSX.IntrinsicAttributes) {
            return (
                <AuthenticationProvider store={store}>
                    <Component {...props} />
                </AuthenticationProvider>
            );
        };
