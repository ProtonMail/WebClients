import {
    START_EVENT_MANAGER,
    STOP_EVENT_MANAGER,
    RESET_EVENT_MANAGER,
    GET_EVENTS
} from './actionTypes';

export default (eventManager) => {
    return () => (next) => (action) => {
        if (!action.type) {
            return next(action)
        }

        const type = action.type;

        if (type === START_EVENT_MANAGER) {
            if (action.payload) {
                eventManager.setEventID(action.payload);
            }
            return eventManager.start();
        }

        if (type === RESET_EVENT_MANAGER) {
            return eventManager.reset();
        }

        if (type === STOP_EVENT_MANAGER) {
            return eventManager.stop();
        }

        if (type === GET_EVENTS) {
            return eventManager.call()
        }

        return next(action);
    };
};
