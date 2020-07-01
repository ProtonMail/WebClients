import React, { useState, useCallback, useImperativeHandle } from 'react';

import Context, { refreshFn } from './context';

interface Props {
    children: React.ReactNode;
}

const ForceRefreshProvider = React.forwardRef<refreshFn, Props>(({ children }: Props, ref) => {
    const [state, setState] = useState(1);

    const refresh = useCallback(() => setState((i) => i + 1), []);

    useImperativeHandle(ref, () => refresh);

    return (
        <Context.Provider value={refresh} key={state}>
            {children}
        </Context.Provider>
    );
});

export default ForceRefreshProvider;
