import { useContext } from 'react';

import AuthenticationContext from './authenticationContext';

const useAuthentication = () => {
    return useContext(AuthenticationContext);
};

export default useAuthentication;
