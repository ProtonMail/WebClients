import { useCallback } from 'react';

import { useLumoDispatch, useLumoSelector } from '../redux/hooks';
import { selectHasTierErrors, selectTierErrors } from '../redux/slices/meta/errors';
import { handleTierError } from '../services/errors/errorHandling';
import type { LUMO_USER_TYPE } from '../types';

export const useTierErrors = () => {
    const dispatch = useLumoDispatch();
    const tierErrors = useLumoSelector((state) => selectTierErrors({ errors: state.errors }));
    const hasTierErrors = useLumoSelector((state) => selectHasTierErrors({ errors: state.errors }));

    const addTierError = useCallback(
        (userType: LUMO_USER_TYPE) => {
            dispatch(handleTierError(userType));
        },
        [dispatch]
    );

    return {
        tierErrors,
        hasTierErrors,
        addTierError,
    };
};
