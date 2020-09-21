import { useContext } from 'react';
import { EventManager } from 'proton-shared/lib/eventManager/eventManager';
import Context from '../containers/eventManager/context';

function useEventManager<EventModel, ListenerResult = void>() {
    const eventManager = useContext(Context);

    if (!eventManager) {
        throw new Error('Trying to use uninitialized EventManagerContext');
    }

    return eventManager as EventManager<EventModel, ListenerResult>;
}

export default useEventManager;
