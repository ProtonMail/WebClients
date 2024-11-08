import { Provider } from 'react-redux';

import type { ApiEvent } from '@proton/activation/src/api/api.interface';
import { useSubscribeEventManager } from '@proton/components';

import MainModal from '../components/Modals/MainModal';
import { event } from './actions';
import { useEasySwitchDispatch, useGenerateEasySwitchStore } from './store';

interface Props {
    children: JSX.Element | (JSX.Element | null)[] | null;
}

const EasySwitchEventListener = ({ children }: Props) => {
    const dispatch = useEasySwitchDispatch();

    useSubscribeEventManager((apiEvent: ApiEvent) => {
        dispatch(event(apiEvent));
    });

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
