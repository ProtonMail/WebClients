import { useContext } from 'react';

import Context from './context';

const useEventManager = () => {
    return useContext(Context);
};

export default useEventManager;
