import { useCallback } from 'react';
import { useHistory } from 'react-router-dom';

export const useLumoNavigate = () => {
    const history = useHistory();
    return useCallback(
        (path: string) => {
            history.push(path);
        },
        [history]
    );
};
