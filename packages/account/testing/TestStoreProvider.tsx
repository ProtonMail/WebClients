import type { ReactNode } from 'react';
import { Provider } from 'react-redux';

import type { Store } from '@reduxjs/toolkit';

import { ProtonStoreContext } from '@proton/react-redux-store/ProtonStoreContext';
import { ModelThunkDispatcher } from '@proton/redux-utilities/hooks';

export const TestStoreProvider = ({ store, children }: { store: Store; children: ReactNode }) => {
    return (
        <Provider context={ProtonStoreContext} store={store}>
            <ModelThunkDispatcher>{children}</ModelThunkDispatcher>
        </Provider>
    );
};
