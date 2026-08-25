import { useMemo } from 'react';

import { useConfig } from '@proton/app-context/useConfig';
import { getAppName } from '@proton/shared/lib/apps/helper';

import useDocumentTitle from './useDocumentTitle';

const useAppTitle = (title?: string, maybeAppName?: string) => {
    const { APP_NAME } = useConfig();

    const memoedTitle = useMemo(() => {
        const appName = maybeAppName || getAppName(APP_NAME);
        return [title, appName].filter(Boolean).join(' - ');
    }, [title]);

    useDocumentTitle(memoedTitle);
};

export default useAppTitle;
