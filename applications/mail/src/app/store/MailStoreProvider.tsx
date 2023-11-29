import { ReactNode } from 'react';

import { ProtonStoreProvider } from '@proton/redux-shared-store';

import { setupStore } from './store';

const store = setupStore();

interface Props {
    children: ReactNode;
}

const MailStoreProvider = ({ children }: Props) => {
    return <ProtonStoreProvider store={store}>{children}</ProtonStoreProvider>;
};

export default MailStoreProvider;
