import React from 'react';
import { useLocation } from 'react-router';
import { extractSearchParameters } from './utils';

export const useSearchParams = () => {
    const location = useLocation();

    const searchParams = React.useMemo(() => {
        return extractSearchParameters(location);
    }, [location]);

    const [value, updateValue] = React.useState(searchParams);

    return [value, updateValue] as [string, React.Dispatch<React.SetStateAction<string>>];
};
