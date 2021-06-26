import { useContext } from 'react';
import ModalsContext from '../containers/modals/modalsContext';

const useModals = () => {
    return useContext(ModalsContext);
};

export default useModals;
