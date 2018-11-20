import { BLACK_FRIDAY } from '../../constants';

/* @ngInject */
function blackFridayHandler($stateParams, dispatchers, blackFridayModalOpener, blackFridayModel) {
    const STATE = {};
    const { dispatcher, on } = dispatchers(['blackFriday']);

    const openInitial = () => {
        const afterSignup = $stateParams.welcome;

        if (blackFridayModel.isDealPeriod(false) && !afterSignup) {
            blackFridayModalOpener();
        }
    };

    const init = () => {
        clearInterval(STATE.intervalHandle);
        STATE.intervalHandle = setInterval(() => dispatcher.blackFriday('tictac'), BLACK_FRIDAY.INTERVAL);
        openInitial();
    };

    on('logout', () => {
        clearInterval(STATE.intervalHandle);
        delete STATE.intervalHandle;
    });

    return init;
}

export default blackFridayHandler;
