import { useContext } from 'react';

import ModalsContext from '../containers/modals/modalsContext';

/**
 * @deprecated Please use useModalTwo or useModalState instead
 */
const useModals = () => {
    return useContext(ModalsContext);
};

export default useModals;
