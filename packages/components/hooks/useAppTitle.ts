import { useEffect } from 'react';
import { APPS_CONFIGURATION } from 'proton-shared/lib/constants';

import useConfig from './useConfig';

const useAppTitle = (title: string, maybeAppName?: string) => {
    const { APP_NAME } = useConfig();
    useEffect(() => {
        const appName = maybeAppName || APPS_CONFIGURATION[APP_NAME]?.name;
        document.title = [title, appName].filter(Boolean).join(' - ');
    }, [title]);
};

export default useAppTitle;
