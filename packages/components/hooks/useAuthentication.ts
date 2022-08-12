import { useContext } from 'react';

import { PrivateAuthenticationStore } from '../containers/app/interface';
import AuthenticationContext from '../containers/authentication/authenticationContext';

const useAuthentication = () => {
    // Force private authentication store because the public app is a special case
    return useContext(AuthenticationContext) as PrivateAuthenticationStore;
};

export default useAuthentication;
