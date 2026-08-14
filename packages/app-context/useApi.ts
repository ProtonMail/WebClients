import { useContext } from 'react';

import type { Api } from '@proton/shared/lib/interfaces';

import { ApiContext } from './apiContext';

const useApi = (): Api => {
    return useContext(ApiContext);
};

export default useApi;
