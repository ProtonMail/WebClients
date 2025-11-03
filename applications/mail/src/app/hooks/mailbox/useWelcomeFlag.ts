import type { DependencyList } from 'react';
import { useEffect, useState } from 'react';

import { useAuthentication } from '@proton/components';
import { getItem, setItem } from '@proton/shared/lib/helpers/sessionStorage';

/**
 * Returns true the first time (depending on deps) it's called after a login, false every time after
 */
export const useWelcomeFlag = (deps: DependencyList) => {
    const { UID } = useAuthentication();
    const [welcomeFlag, setWelcomeFlag] = useState(() => {
        const key = `w-${UID}`;
        const hasSession = getItem(key, '0');
        setItem(key, '1');
        return hasSession === '0';
    });
    const [welcomeShown, setWelcomeShown] = useState(false);

    useEffect(() => {
        if (!welcomeShown) {
            setWelcomeFlag(true);
            setWelcomeShown(true);
        } else {
            setWelcomeFlag(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-3C4B65
    }, deps);

    return welcomeFlag;
};
