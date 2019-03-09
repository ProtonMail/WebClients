import { useContext } from 'react';
import authenticationStoreContext from '../context/authenticationStore';

const useAuthenticationStore = () => {
    return useContext(authenticationStoreContext);
};

export default useAuthenticationStore;
