import type { FC, PropsWithChildren } from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import { createClientStore } from 'proton-pass-extension/lib/store/client-store';

import useInstance from '@proton/hooks/useInstance';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';

import { useExtensionContext } from './ExtensionSetup';

export const ExtensionStore: FC<PropsWithChildren> = ({ children }) => {
    const { endpoint } = usePassCore();
    const { tabId } = useExtensionContext();
    const store = useInstance(() => createClientStore(endpoint, tabId));

    return <ReduxProvider store={store}>{children}</ReduxProvider>;
};
