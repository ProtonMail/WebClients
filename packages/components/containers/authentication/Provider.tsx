import { ReactNode } from 'react';

import { PrivateAuthenticationStore, PublicAuthenticationStore } from '../app/interface';
import AuthenticationContext from './authenticationContext';

export interface Props {
    children?: ReactNode;
    store: PrivateAuthenticationStore | PublicAuthenticationStore;
}

const AuthenticationProvider = ({ store, children }: Props) => {
    return <AuthenticationContext.Provider value={store}>{children}</AuthenticationContext.Provider>;
};

export default AuthenticationProvider;
