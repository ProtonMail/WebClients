import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom-v5-compat';

// TODO: handle it with containers
import { extractSearchParameters } from '../../../store/_search/utils';

export const useSearchParams = () => {
    const location = useLocation();

    const [value, updateValue] = useState('');

    useEffect(() => {
        updateValue(extractSearchParameters(location));
    }, [location]);

    return [value, updateValue] as [string, Dispatch<SetStateAction<string>>];
};
