import React from 'react';
import { PrivateAuthenticationStore, PublicAuthenticationStore } from '../app/interface';

import AuthenticationContext from './authenticationContext';

interface Props {
    children?: React.ReactNode;
    store: PrivateAuthenticationStore | PublicAuthenticationStore;
}
const AuthenticationProvider = ({ store, children }: Props) => {
    return <AuthenticationContext.Provider value={store}>{children}</AuthenticationContext.Provider>;
};

export default AuthenticationProvider;
