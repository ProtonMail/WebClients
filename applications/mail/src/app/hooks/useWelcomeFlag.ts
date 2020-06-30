import { useEffect, DependencyList, useState } from 'react';

/**
 * Returns true the first time (depending on deps) it's called after a login, false every time after
 */
export const useWelcomeFlag = (throughLogin: boolean, deps: DependencyList) => {
    const [welcomeFlag, setWelcomeFlag] = useState(throughLogin);
    const [welcomeShown, setWelcomeShown] = useState(false);

    useEffect(() => {
        if (!welcomeShown && throughLogin) {
            setWelcomeFlag(true);
            setWelcomeShown(true);
        } else {
            setWelcomeFlag(false);
        }
    }, deps);

    return welcomeFlag;
};
