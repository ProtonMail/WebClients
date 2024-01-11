import type { FC, PropsWithChildren } from 'react';
import { createContext, useContext, useRef } from 'react';

import { useAddresses, useApi, useAuthentication, useUser } from '@proton/components/hooks';
import type { MaybeNull } from '@proton/pass/types';

import { createPassBridge } from '.';
import type { PassBridge } from './types';

export const PassBridgeContext = createContext<MaybeNull<PassBridge>>(null);

export const PassBridgeProvider: FC<PropsWithChildren> = ({ children }) => {
    const api = useApi();
    const [user] = useUser();
    const [addresses] = useAddresses();
    const authStore = useAuthentication();

    const bridge = useRef(createPassBridge({ api, user, addresses: addresses!, authStore }));

    return <PassBridgeContext.Provider value={bridge.current}>{children}</PassBridgeContext.Provider>;
};

export const usePassBridge = () => {
    const passBridge = useContext(PassBridgeContext);
    if (!passBridge) throw new Error('PassBridge was not instantiated');
    return passBridge;
};
