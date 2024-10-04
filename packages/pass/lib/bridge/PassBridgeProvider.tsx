import type { FC, PropsWithChildren } from 'react';
import { createContext, useContext } from 'react';

import { useApi } from '@proton/components';
import useInstance from '@proton/hooks/useInstance';
import type { MaybeNull } from '@proton/pass/types';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';

import { createPassBridge } from '.';
import type { PassBridge } from './types';

export const PassBridgeContext = createContext<MaybeNull<PassBridge>>(null);

export const PassBridgeProvider: FC<PropsWithChildren> = ({ children }) => {
    const api = useApi();
    const silentAPI = getSilentApi(api);
    const bridge = useInstance(() => createPassBridge(silentAPI));

    return <PassBridgeContext.Provider value={bridge}>{children}</PassBridgeContext.Provider>;
};

export const usePassBridge = () => {
    const passBridge = useContext(PassBridgeContext);
    if (!passBridge) throw new Error('PassBridge was not instantiated');
    return passBridge;
};
