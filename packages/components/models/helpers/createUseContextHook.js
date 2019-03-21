import { useContext } from 'react';

const createUseContextHook = (Context) => {
    return () => {
        return useContext(Context);
    };
};

export default createUseContextHook;
