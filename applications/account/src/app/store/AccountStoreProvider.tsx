import { ReactNode } from 'react';

import { ProtonStoreProvider } from '@proton/redux-shared-store';

import { store } from './store';

interface Props {
    children: ReactNode;
}

const AccountStoreProvider = ({ children }: Props) => {
    return <ProtonStoreProvider store={store}>{children}</ProtonStoreProvider>;
};

export default AccountStoreProvider;
