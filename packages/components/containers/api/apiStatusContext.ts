import { createContext } from 'react';

export const defaultApiStatus = {
    offline: false,
    apiUnreachable: '',
    appVersionBad: false,
};

export default createContext(defaultApiStatus);
