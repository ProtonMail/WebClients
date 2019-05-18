import { useContext } from 'react';
import ModalsContext from '../context/modals';

const useModals = () => {
    return useContext(ModalsContext);
};

export default useModals;
