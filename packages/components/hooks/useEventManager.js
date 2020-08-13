import { useContext } from 'react';

import Context from '../containers/eventManager/context';

const useEventManager = () => {
    return useContext(Context);
};

export default useEventManager;
