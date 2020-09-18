import { useMemo } from 'react';
import { APPS_CONFIGURATION } from 'proton-shared/lib/constants';

import useConfig from './useConfig';
import useDocumentTitle from './useDocumentTitle';

const useAppTitle = (title: string, maybeAppName?: string) => {
    const { APP_NAME } = useConfig();

    const memoedTitle = useMemo(() => {
        const appName = maybeAppName || APPS_CONFIGURATION[APP_NAME]?.name;
        return [title, appName].filter(Boolean).join(' - ');
    }, [title]);

    useDocumentTitle(memoedTitle);
};

export default useAppTitle;
