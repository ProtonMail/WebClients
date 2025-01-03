import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { asyncRequestDispatcherFactory } from '@proton/pass/store/request/utils';

export const useAsyncRequestDispatch = () => {
    const dispatch = useDispatch();
    return useCallback(asyncRequestDispatcherFactory(dispatch), []);
};
