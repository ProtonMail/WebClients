import { Provider } from 'react-redux';

import { useSubscribeEventManager } from '@proton/components/hooks';

import { event } from './actions';
import { useEasySwitchDispatch, useGenerateEasySwitchStore } from './store';
import { ApiEvent } from './types/events.types';

interface Props {
    children: JSX.Element | JSX.Element[];
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
        </Provider>
    );
};

export default EasySwitchStoreProvider;
