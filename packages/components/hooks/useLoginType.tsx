import { useState } from 'react';
import { isFirefox } from 'proton-shared/lib/helpers/browser';
import { LoginTypes } from 'proton-shared/lib/authentication/LoginInterface';

const useLoginType = () => {
    const [loginType] = useState(() => {
        // Firefox does not preserve localStorage across tabs in certain configurations.
        // https://bugzilla.mozilla.org/show_bug.cgi?id=1540402
        if (isFirefox()) {
            return LoginTypes.PERSISTENT_WORKAROUND;
        }
        return LoginTypes.PERSISTENT;
    });
    return loginType;
};

export default useLoginType;
