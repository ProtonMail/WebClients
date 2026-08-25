import { useContext } from 'react';

import type { Api } from '@proton/shared/lib/interfaces';

import { ApiContext } from './apiContext';

export const useApi = (): Api => {
    return useContext(ApiContext);
};
