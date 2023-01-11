import { Provider } from 'react-redux';

import { ApiEvent } from '@proton/activation/api/api.interface';
import MainModal from '@proton/activation/components/Modals/MainModal';
import { useSubscribeEventManager } from '@proton/components/hooks';

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
