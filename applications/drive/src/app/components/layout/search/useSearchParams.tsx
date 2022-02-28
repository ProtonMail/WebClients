import { useState, useEffect } from 'react';
import { useLocation } from 'react-router';

// TODO: handle it with containers
import { extractSearchParameters } from '../../../store/search/utils';

export const useSearchParams = () => {
    const location = useLocation();

    const [value, updateValue] = useState('');

    useEffect(() => {
        updateValue(extractSearchParameters(location));
    }, [location]);

    return [value, updateValue] as [string, React.Dispatch<React.SetStateAction<string>>];
};
