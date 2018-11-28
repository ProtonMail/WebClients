import { BLACK_FRIDAY } from '../../constants';

/* @ngInject */
function blackFridayHandler($stateParams, dispatchers) {
    const STATE = {};
    const { dispatcher, on } = dispatchers(['blackFriday']);

    const init = () => {
        clearInterval(STATE.intervalHandle);
        STATE.intervalHandle = setInterval(() => dispatcher.blackFriday('tictac'), BLACK_FRIDAY.INTERVAL);
    };

    on('logout', () => {
        clearInterval(STATE.intervalHandle);
        delete STATE.intervalHandle;
    });

    return init;
}

export default blackFridayHandler;
