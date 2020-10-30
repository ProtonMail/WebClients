import { createContext } from 'react';

export const defaultApiStatus = {
    apiUnreachable: false,
    appVersionBad: false,
};

export default createContext(defaultApiStatus);
