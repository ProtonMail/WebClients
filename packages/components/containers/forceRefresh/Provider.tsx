import type { ReactNode } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useState } from 'react';

import type { RefreshFn } from './context';
import Context from './context';

interface Props {
    children: ReactNode;
}

const ForceRefreshProvider = forwardRef<RefreshFn, Props>(({ children }: Props, ref) => {
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
