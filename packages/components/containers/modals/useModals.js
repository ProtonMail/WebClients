import { useContext } from 'react';
import ModalsContext from './modalsContext';

const useModals = () => {
    return useContext(ModalsContext);
};

export default useModals;
