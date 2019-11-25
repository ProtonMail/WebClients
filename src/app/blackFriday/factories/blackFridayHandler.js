import { BLACK_FRIDAY } from '../../constants';

/* @ngInject */
function blackFridayHandler(Payment, blackFridayModel, dispatchers) {
    const OCTOBER_01 = +new Date('2019-10-01') / 1000; // Unix TS

    const isAbleToSeeBF = (latest = 0) => {
        // New user
        if (latest === null) {
            return true;
        }

        // Free from at least > 1 month
        return latest && latest < OCTOBER_01;
    };

    async function init() {
        const { dispatcher } = dispatchers(['blackFriday']);
        const { LastSubscriptionEnd } = await Payment.latestSubscription();

        if (isAbleToSeeBF(LastSubscriptionEnd)) {
            blackFridayModel.allow();
            dispatcher.blackFriday('run');
            setInterval(() => {
                dispatcher.blackFriday('run');
            }, BLACK_FRIDAY.INTERVAL);
        }
    }

    return init;
}

export default blackFridayHandler;
