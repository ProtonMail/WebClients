import { useEffect } from 'react';

import { setIsProtonUserCookie } from '../helpers/protonUserCookie';

// Set a cookie for Proton users, used by proton.me website
// Also use in Drive download page to show/hide some marketing info
const useIsProtonUserCookie = () => {
    useEffect(() => {
        setIsProtonUserCookie();
    }, []);
};

export default useIsProtonUserCookie;
