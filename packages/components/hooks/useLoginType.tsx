import { useState } from 'react';
import { LoginTypes } from '@proton/shared/lib/authentication/LoginInterface';

const useLoginType = () => {
    const [loginType] = useState(() => {
        return LoginTypes.PERSISTENT;
    });
    return loginType;
};

export default useLoginType;
