import { useEffect } from 'react';
import { Provider } from 'react-redux';

import { useEventManagerV6 } from '@proton/components/containers/eventManager/EventManagerV6Provider';
import useEventManager from '@proton/components/hooks/useEventManager';

import MainModal from '../components/Modals/MainModal';
import { event, eventLoopV6 } from './actions';
import { useEasySwitchDispatch, useGenerateEasySwitchStore } from './store';

interface Props {
    children: JSX.Element | (JSX.Element | null)[] | null;
}

const EasySwitchEventListener = ({ children }: Props) => {
    const dispatch = useEasySwitchDispatch();

    const { subscribe } = useEventManager();
    const { coreEventV6Manager } = useEventManagerV6();

    useEffect(() => {
        const unsubcribe = subscribe((apiEvent) => {
            dispatch(event(apiEvent));
        });

        const unsubscribeV6 = coreEventV6Manager?.subscribe(async (event) => {
            await dispatch(eventLoopV6(event));
        });

        return () => {
            unsubcribe?.();
            unsubscribeV6?.();
        };
    }, [dispatch]);

    return <>{children}</>;
};

const EasySwitchStoreProvider = ({ children }: Props) => {
    const easySwitchStore = useGenerateEasySwitchStore();
    return (
        <Provider store={easySwitchStore}>
            <EasySwitchEventListener>{children}</EasySwitchEventListener>
            <MainModal />
        </Provider>
    );
};

export default EasySwitchStoreProvider;
