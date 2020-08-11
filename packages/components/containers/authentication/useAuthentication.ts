import { useContext } from 'react';

import AuthenticationContext from './authenticationContext';
import { PrivateAuthenticationStore } from '../app/interface';

const useAuthentication = () => {
    // Force private authentication store because the public app is a special case
    return useContext(AuthenticationContext) as PrivateAuthenticationStore;
};

export default useAuthentication;
