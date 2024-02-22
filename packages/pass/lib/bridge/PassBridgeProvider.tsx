import type { FC, PropsWithChildren } from 'react';
import { createContext, useContext } from 'react';

import { useApi } from '@proton/components/hooks';
import useInstance from '@proton/hooks/useInstance';
import type { MaybeNull } from '@proton/pass/types';

import { createPassBridge } from '.';
import type { PassBridge } from './types';

export const PassBridgeContext = createContext<MaybeNull<PassBridge>>(null);

export const PassBridgeProvider: FC<PropsWithChildren> = ({ children }) => {
    const api = useApi();
    const bridge = useInstance(() => createPassBridge(api));

    return <PassBridgeContext.Provider value={bridge}>{children}</PassBridgeContext.Provider>;
};

export const usePassBridge = () => {
    const passBridge = useContext(PassBridgeContext);
    if (!passBridge) throw new Error('PassBridge was not instantiated');
    return passBridge;
};
