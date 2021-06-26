import { useContext } from 'react';

import AuthenticationContext from '../containers/authentication/authenticationContext';
import { PrivateAuthenticationStore } from '../containers/app/interface';

const useAuthentication = () => {
    // Force private authentication store because the public app is a special case
    return useContext(AuthenticationContext) as PrivateAuthenticationStore;
};

export default useAuthentication;
