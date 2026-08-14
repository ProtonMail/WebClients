import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import { logger } from '@proton/logger';

export const useMailNavigationLogger = () => {
    const history = useHistory();

    useEffect(() => {
        const unlisten = history.listen((location) => {
            logger.log('User navigate to', location.pathname + location.hash + location.search);
        });
        return unlisten;
    }, [history]);
};
