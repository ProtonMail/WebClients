import { useState } from 'react';
import { type Selector, useStore } from 'react-redux';

import type { State } from '../store/types';

export const useSelectorOnce = <TResult>(selector: Selector<State, TResult>): TResult => {
    const store = useStore<State>();
    const [res] = useState(() => selector(store.getState()));
    return res;
};
