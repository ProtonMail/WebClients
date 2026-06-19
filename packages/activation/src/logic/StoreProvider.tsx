import { useEffect } from 'react';
import { Provider } from 'react-redux';

import type { ProtonDriveClient } from '@protontech/drive-sdk';

import { useEventManagerV6 } from '@proton/components/containers/eventManager/EventManagerV6Provider';
import useEventManager from '@proton/components/hooks/useEventManager';

import BYOEFlowModals from '../components/Modals/BYOEFlowModals';
import MainModal from '../components/Modals/MainModal';
import SyncLostListener from './SyncLostListener';
import { event, eventLoopV6 } from './actions';
import { DriveSdkContextProvider } from './driveContext';
import { useEasySwitchDispatch, useGenerateEasySwitchStore } from './store';

interface Props {
    children: JSX.Element | (JSX.Element | null)[] | null;
    drive?: ProtonDriveClient;
}

const EasySwitchEventListener = ({ children }: Props) => {
    const dispatch = useEasySwitchDispatch();

    const { subscribe } = useEventManager();
    const { coreEventV6Manager } = useEventManagerV6();

    useEffect(() => {
        const unsubscribe = subscribe((apiEvent) => {
            dispatch(event(apiEvent));
        });

        const unsubscribeV6 = coreEventV6Manager?.subscribe(async (event) => {
            await dispatch(eventLoopV6(event));
        });

        return () => {
            unsubscribe?.();
            unsubscribeV6?.();
        };
    }, [dispatch]);

    return (
        <>
            {children}
            <SyncLostListener />
        </>
    );
};

const EasySwitchStoreProvider = ({ children, drive }: Props) => {
    const easySwitchStore = useGenerateEasySwitchStore();

    return (
        <DriveSdkContextProvider value={drive}>
            <Provider store={easySwitchStore}>
                <EasySwitchEventListener>{children}</EasySwitchEventListener>
                <MainModal />
                <BYOEFlowModals />
            </Provider>
        </DriveSdkContextProvider>
    );
};

export default EasySwitchStoreProvider;
