import React from 'react';

const createProvider = (Context, useValue) => {
    return ({ children, ...rest }) => {
        return <Context.Provider value={useValue(rest)}>{children}</Context.Provider>;
    };
};

export default createProvider;
